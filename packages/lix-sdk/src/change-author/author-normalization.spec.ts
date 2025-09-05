import { describe, it } from "vitest";

// Author Normalization (Step 4) — Specification
//
// Goals
// - Store authors at the commit level to avoid D×M per-change author rows.
// - Always materialize authors into the state cache for fast queries.
// - Allow explicit per-change author edits; those create real change_author rows
//   and take precedence over synthesized commit-level authors for that change.
//
// Acceptance criteria
// 1) commit.author_account_ids
//    - Each commit snapshot contains an array field author_account_ids: string[]
//    - When committing, the set reflects the accounts active for that commit.
//
// 2) Synthesized/materialized change_author rows (cache)
//    - For a commit with id C and authors [A1, A2], we synthesize M rows and upsert
//      them into the cache so queries over change_author(_all) are fast.
//    - The synthesized rows use (change_id = C, account_id = Ai) as the PK.
//      This normalizes authors to per-commit cardinality (M), not D×M.
//
// 3) Explicit per-change override
//    - If a user edits authors for a specific change X, create real
//      change_author change rows that reference X (change_id = X).
//    - The commit that records this edit includes these change_author rows in
//      its change_ids membership.
//    - For change X, explicit rows are authoritative and suppress synthesized
//      commit-level authors in reads.

describe("Author normalization (Step 4)", () => {
  it.todo("commit snapshot includes author_account_ids for active authors");

  it.todo(
    "synthesizes and materializes change_author rows per commit (change_id = commit id)"
  );

  it.todo(
    "explicit author edit creates real change_author rows (change_id = change id) and they appear in commit.change_ids"
  );
});

