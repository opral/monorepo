---
"@inlang/sdk": patch
---

Load and compile projects with hundreds of thousands of translations, on the Lix query API (`query`, `stream`, `read`, `execute`).

- `selectBundleNested()` without a bundle filter now streams bundles, messages, and variants as three ordered scans of one Lix snapshot instead of one three-way join (about 2.5× faster at 150k translations), so the three tables are read at the same state and no buffered read cap applies. Projects above roughly 200k translations previously failed with `LIX_READ_RESOURCE_EXHAUSTED`.
- Kysely `.stream()` streams through Lix (`stream()`), including inside transactions, where it sees the transaction's staged writes.
- Kysely selects run through Lix `query()`, which never writes; other statements run through `execute()`. JSON columns are bound with `json()`.
- Importing a large fresh project commits in bundle-aligned groups of at most 100k rows, so a single commit no longer exceeds the Lix worker's operation deadline (`LIX_WRITE_OUTCOME_UNKNOWN`). Smaller imports still use one transaction.
- `executeLixBatch()` runs its statements in one Lix transaction (rerun on conflict) and returns plain statement results without `statementIndex`.
