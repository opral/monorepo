---
"@inlang/paraglide-sveltekit": patch
---

The link preprocessor no longer crashes when encountering a file with a syntax error. Insetad it will log a warning & noop. Reporting the error is delegated to the main svelte parser.
