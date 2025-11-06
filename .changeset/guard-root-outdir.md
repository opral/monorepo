---
"@inlang/paraglide-js": patch
---

Prevent the compiler from accepting `outdir: "./"`, avoiding accidental project deletion during cleanup.

Refs https://github.com/opral/inlang-sdk/issues/245.
