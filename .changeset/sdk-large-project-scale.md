---
"@inlang/sdk": patch
---

Load and compile projects with hundreds of thousands of translations, on the Lix query API (`query`, `stream`, `execute`).

- `selectBundleNested()` streams one joined query, preserving ordering and consistency while avoiding the buffered read cap for large projects.
- Kysely `.stream()` streams through Lix (`stream()`), including inside transactions, where it sees the transaction's staged writes.
- Kysely selects run through Lix `query()`, which never writes; other statements run through `execute()`. JSON columns are bound with `json()`.
- Fresh directory loads and imports with `allowPartialImport: true` commit in bundle-aligned groups targeting 100k rows (a larger single bundle stays intact), so a single commit no longer exceeds the Lix worker's operation deadline (`LIX_WRITE_OUTCOME_UNKNOWN`). Imports are atomic by default. Opting into partial imports leaves earlier groups committed if a later group fails.
- `executeLixBatch()` runs its statements in one Lix transaction (rerun on conflict) and returns plain statement results without `statementIndex`.

Project exports read the project identity, files, and translations in one transaction.
