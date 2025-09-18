---
"@inlang/paraglide-js": patch
---

Fixes `overwriteSetLocale` to keep the full `(locale, options?)` signature when overriding `setLocale`, preventing TypeScript from rejecting calls that pass `{ reload: false }`. Adds a regression test ensuring custom handlers receive the options object.
