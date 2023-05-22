---
"@inlang/badge": patch
---

fix: percentage calculation

- the percentage doesn't account for lints anymore (because that is confusing)
- the preferred language logic has been removed (because the user agent of the user is never passed to the server and makes caching harder)
