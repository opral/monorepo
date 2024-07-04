---
"@inlang/paraglide-next": patch
---

fix issue where path-segments that start with a language tag confused the router.

Eg: `/entropy` would match the language `en` & be resolved to `/tropy`