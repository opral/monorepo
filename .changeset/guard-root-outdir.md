---
"@inlang/paraglide-js": patch
---

Prevent the compiler from accepting `outdir` values that resolve to the project root, avoiding accidental project deletion during cleanup.

Refs https://github.com/opral/inlang-sdk/issues/245.
