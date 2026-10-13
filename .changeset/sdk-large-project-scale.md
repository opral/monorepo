---
"@inlang/sdk": patch
---

Improved loading, reading, and exporting projects with hundreds of thousands of translations, with lower memory use for large reads.

- Large directory loads and partial imports process data in batches. Imports remain atomic by default; `allowPartialImport: true` keeps earlier successful batches if a later batch fails.
- Project exports preserve a consistent view of files and translations.

Updated the Lix dependency to v0.20.1. Applications that provide their own Lix instance must upgrade it as well.
