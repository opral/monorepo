---
"@inlang/sdk": minor
"@inlang/badge": patch
"@inlang/cli": patch
"@inlang/editor": patch
"@inlang/github-lint-action": patch
"vs-code-extension": patch
"@inlang/sdk-load-test": patch
---

SDK Breaking change: LintReports get() and getAll() are now async, and non-reactive.
Reduces (does not eliminate) excessive sdk resource consumption.
