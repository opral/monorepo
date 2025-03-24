---
"@inlang/paraglide-js": patch
---

chore(runtime): add cookieMaxAge option to setLocale

closes https://github.com/opral/inlang-paraglide-js/issues/483

- Added cookieMaxAge option to setLocale, allowing control over the cookie expiration time.
- Default cookieMaxAge is set to 400 days (Chrome’s max-age limit).
- Updated getLocale tests to verify max-age is set in cookies.
- Fixed minor typos in documentation.
