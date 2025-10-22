---
"@inlang/paraglide-js": patch
---

Fix fallback assignment generation so locale chains emit dependencies first and avoid "Block-scoped variable used before its declaration" errors. See https://github.com/opral/inlang-paraglide-js/issues/507 for details.
