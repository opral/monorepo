---
"@inlang/paraglide-js": patch
---

`extractLocaleFromUrl()` now uses a cache for the last value.

Useful on the client-side where the same URL is being extracted many times for each message on a given page.
