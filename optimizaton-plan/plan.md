# Write Amplification → Incremental Optimization Plan

Goal: Reduce change rows per user mutation while staying compatible with today’s flows (`create-checkpoint`, history-by-commit) and without introducing a new “commit package” until it clearly adds value.

Scope: 1 domain mutation on a single version, 1 author, typical commit (no merge).

## Notation (per‑commit complexity)

- D: number of domain changes e.g. user triggers a key value update
- P: number of parent commits (size of `parent_commit_ids`). Usually 1; >1 for merges.
- M: number of distinct authors associated with the commit.

## Baseline (Status Quo)

Observed new change rows for a single domain mutation:

- Total: 30
- By schema (approximate from logs):
  - `lix_key_value`: 1
  - `lix_change_author`: 1
  - `lix_change_set_element`: 20
  - `lix_change_set`: 2
  - `lix_commit`: 2
  - `lix_commit_edge`: 2
  - `lix_version`: 2

Notes:

- 20 CSE rows account for most of the amplification (hot-path index writes).
- The remaining rows are “meta” (commit, edges, version, change set), partly duplicated across scopes (e.g., version + global).

## Step 1 — Derive CSEs (no hot‑path CSE writes)

- Change: Stop inserting `lix_change_set_element` on commit. Derive domain‑only CSEs in a materializer/view from commit membership (initially `commit.change_ids`; later, the commit package’s `domain_change_ids`).
- Rationale: CSEs are an index over change_set ↔ change and can be synthesized cheaply; writing them explodes cost linearly with the number of changes.
- Compatibility:
  - `state-history`: It joins `change_set_element_all`. Provide a compatibility view that unions physical rows (for old commits) with derived rows (for new commits), or switch to the derived view behind the existing name.
  - `create-checkpoint`: Unchanged. It references `commit.change_set_id` and does not require physical CSE rows.
- Estimated delta: −20 rows (30 → 10).
- Materializer complexity: per commit O(D) to enumerate domain changes (unchanged), but removes O(D) storage writes and index maintenance. `state-history` can read derived CSEs in O(D) via JSON extraction instead of table joins.

## Step 2 — Replace `lix_commit_edge` rows with derived edges

- Change: Stop inserting `lix_commit_edge` rows. Keep `parent_commit_ids` inside the `lix_commit` snapshot and expose a view that explodes parents into an edge shape for queries.
- Rationale: Parent edges are derivable from commit snapshots; no need for extra rows per parent.
- Compatibility:
  - `state-history`: Today it joins `commit_edge_all`. Provide a compatibility view `commit_edge_all` that explodes `commit_all.parent_commit_ids` to `(parent_id, child_id)` so existing queries continue to work.
  - `create-checkpoint`: Still emits a parent relationship; it can write a no‑op (or rely on the derived view).
- Estimated delta: −2 rows (10 → 8).
- Materializer complexity: ancestry traversal stays O(P) parents per commit (unchanged), but eliminates O(P) storage writes and reduces join cost to JSON array scan (lower constants).

## Step 3 — Drop Dual Commit (de‑duplicate commit, version, and change_set)

- Change: Stop emitting the “global” duplicate for graph metadata. For each mutation, persist exactly one set of graph rows tied to the mutated version:
  - `lix_commit`: only the version’s commit (no global duplicate)
  - `lix_version`: only the mutated version’s tip move (no global duplicate)
  - `lix_change_set`: only one row per commit (no second/global duplicate)
- Rationale: The dual‑commit model duplicates meta across scopes. The graph topology is global, but does not require duplicate change rows; views/materializer can project what’s needed.
- Compatibility:
  - `create-checkpoint`: Unchanged. It updates `version.commit_id` and `version.working_commit_id` and labels the checkpoint.
  - `state-history`: Unchanged. Edges are derived from `parent_commit_ids` and CSEs are derived/materialized; both remain global in views/cache.
- Estimated delta: −3 rows (8 → 5) from Step 2’s baseline.
- Notes:
  - Make edge materialization unconditional: always materialize `lix_commit_edge` in the global scope from `parent_commit_ids` so cache/queries do not depend on a “global” commit change row.
- Materializer complexity: no change in O(D + P); reduces constants by removing duplicate scans.

## Result After Steps 1–3 (1 domain mutation)

- `lix_key_value`: 1
- `lix_change_author`: 1
- `lix_change_set`: 1
- `lix_commit`: 1 (public, minimal; includes `change_set_id`)
- `lix_version`: 1
- Derived (not inserted):
  - `lix_change_set_element` (global) from commit membership
  - `lix_commit_edge` from `parent_commit_ids`
- Total inserted rows: ~5 (down from 30)

## Step 4 (Optional) — Author normalization for multi‑change commits

- Change: Keep commit‑level authors and expand to per‑change via a view joined through CSEs. Only implement if you want to shrink rows when a commit touches many domain changes with the same authors.
- Rationale: For N changes and M authors, physical rows go from N×M → M.
- Compatibility:
  - Per‑change authorship can remain materialized if desired; otherwise provide a compatibility view `change_author_all`.
- Estimated delta: 0 for single‑change commits; potentially large savings for multi‑change commits.
- Materializer complexity: per‑commit author aggregation can be computed in O(D + M) (domain changes + authors) via CSE join, instead of reading O(D×M) physical rows.

## Step 5 (Later) — Introduce `meta_change_ids`

- Add `meta_change_ids` to `lix_commit` that carries `commit_id`, `parent_commit_ids`, `change_set_id`, and split membership: `domain_change_ids` vs `meta_change_ids`.
- Benefits:
  - Clear separation of “how we materialize” vs “what we expose”.
  - Enables further internal flexibility (e.g., deterministic working heads, background backfills) without API churn.
- Estimated delta: No immediate row reduction versus Step 1 (CSEs already derived), but simplifies long‑term evolution.
- Materializer complexity: keeps per‑commit apply at O(D + P); decoupling enables smaller, more targeted scans (lower constants) and easier checkpointing.

Potential follow‑up: Unify version pointers under control (tip)

- Today, `commit_id` (version tip) lives in the control ledger (`lix_version_tip`), while `working_commit_id` lives in the descriptor (`lix_version_descriptor`).
- This split forces write‑paths (e.g., commit.ts) to read descriptor just to obtain `working_commit_id` while also reading tip for `commit_id`.
- Proposal: Move `working_commit_id` into the control plane (extend `lix_version_tip` or add a sibling control entity to carry the working pointer). Keep descriptor purely domain (id, name, inherits, hidden).
- Benefits: Single source for pointers, simpler commit logic (no descriptor fetch for pointer logic), and a clearer domain/control separation consistent with commit‑anchored tips.

## Compatibility Summary

- `create-checkpoint`: Remains valid throughout. It needs a real `commit` with a `change_set_id`, and will continue to link the previous head as a checkpoint and create a new empty working commit.
- `state-history`: Continue to “query by commit” by ensuring two compatibility views exist when steps land:
  - `commit_edge_all` (derived from `commit_all.parent_commit_ids`).
  - `change_set_element_all` (derived for new commits; union with physical for legacy).

## Rollout Guidance

- Ship Steps 1 and 2 first. Add compatibility views and tests; ensure commit edges are materialized globally from `parent_commit_ids`.
- Ship Step 3 “Drop Dual Commit”: remove the global duplicates for commit/version/change_set and keep edge/CSE derivation intact.
- Consider Step 5 when you want to slim public commit snapshots and decouple lineage/membership fully.

## Cleanup TODOs

- Merge filter cleanup: In `packages/lix-sdk/src/version/merge-version.ts`, we temporarily filter control/meta schemas out of winners/deletions to keep commit membership deterministic under cache-miss. Do not blanket-filter `lix_*`; some are valid domain (e.g., `lix_key_value`, `lix_file_descriptor`). Remove this filter after Step 5 introduces `meta_change_ids` and formally splits domain vs meta membership.
