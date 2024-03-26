---
"@inlang/paraglide-js-adapter-astro": patch
---

fix: `languageTag()` not being set properly on windows. This bug was caused by duplicate module instantiation.
