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

## Step 3 — De‑duplicate `lix_version` and `lix_change_set`

- Change: Persist only one `lix_version` row per tip move (no duplicate under `global`). Persist only one `lix_change_set` row per commit (commit‑independent, global).
- Rationale: Avoid meta duplication across scopes; use views for cross‑scope reads.
- Compatibility:
  - `create-checkpoint`: Still moves `version.commit_id` and `version.working_commit_id` and labels the checkpoint.
  - `state-history`: Reads commit ancestry and CSEs; unaffected by version/change_set de‑dupe.
- Estimated delta: −2 rows (8 → 6).
- Materializer complexity: primarily reduces constants (fewer meta rows scanned). Asymptotic O(D + P) per commit remains unchanged.

## Step 4 — De‑duplicate `lix_commit` (version‑local only)

- Change: Persist exactly one `lix_commit` row per commit (the version’s commit). Do not also write a duplicate row under `global`.
- Rationale: A commit is version‑scoped; “global” can project commit metadata via views when needed.
- Compatibility:
  - `create-checkpoint`: Unchanged. It reads `version.working_commit_id` and `commit.change_set_id`.
-  `state-history`: Unchanged. The commit still exists in `commit_all`.
- Estimated delta: −1 row (6 → 5).
- Materializer complexity: no change in O(); reduces constants by removing duplicate scans.

## Result After Steps 1–4 (1 domain mutation)

- `lix_key_value`: 1
- `lix_change_author`: 1
- `lix_change_set`: 1
- `lix_commit`: 1 (public, minimal; includes `change_set_id`)
- `lix_version`: 1
- Derived (not inserted):
  - `lix_change_set_element` (global) from commit membership
  - `lix_commit_edge` from `parent_commit_ids`
- Total inserted rows: ~5 (down from 30)

## Step 5 (Optional) — Author normalization for multi‑change commits

- Change: Keep commit‑level authors and expand to per‑change via a view joined through CSEs. Only implement if you want to shrink rows when a commit touches many domain changes with the same authors.
- Rationale: For N changes and M authors, physical rows go from N×M → M.
- Compatibility:
  - Per‑change authorship can remain materialized if desired; otherwise provide a compatibility view `change_author_all`.
- Estimated delta: 0 for single‑change commits; potentially large savings for multi‑change commits.
- Materializer complexity: per‑commit author aggregation can be computed in O(D + M) (domain changes + authors) via CSE join, instead of reading O(D×M) physical rows.

## Step 6 (Later) — Introduce an internal “commit package”

- Change: Add an internal `lix_commit_package` (or similar) that carries `commit_id`, `parent_commit_ids`, `change_set_id`, and split membership: `domain_change_ids` vs `meta_change_ids`.
- Public `lix_commit` stays minimal (id, change_set_id). Parents and membership migrate to the package.
- Benefits:
  - Clear separation of “how we materialize” vs “what we expose”.
  - Enables further internal flexibility (e.g., deterministic working heads, background backfills) without API churn.
- Estimated delta: No immediate row reduction versus Step 1 (CSEs already derived), but simplifies long‑term evolution.
- Materializer complexity: keeps per‑commit apply at O(D + P); decoupling enables smaller, more targeted scans (lower constants) and easier checkpointing.

## Compatibility Summary

- `create-checkpoint`: Remains valid throughout. It needs a real `commit` with a `change_set_id`, and will continue to link the previous head as a checkpoint and create a new empty working commit.
- `state-history`: Continue to “query by commit” by ensuring two compatibility views exist when steps land:
  - `commit_edge_all` (derived from `commit_all.parent_commit_ids`).
  - `change_set_element_all` (derived for new commits; union with physical for legacy).

## Rollout Guidance

- Ship Steps 1 and 2 first (pure `lix_commit` changes). Add compatibility views and tests.
- Ship Step 3 behind a flag: derive CSEs, verify equivalence, then disable hot‑path CSE writes.
- Ship Step 4 to remove meta duplication.
- Consider Step 6 (commit package) when you want to slim public commit snapshots and decouple lineage/membership fully.

