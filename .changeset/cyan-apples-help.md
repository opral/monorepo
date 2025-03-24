---
"@inlang/paraglide-js": patch
---

add `cookieMaxAge` option to compiler and runtime

Closes https://github.com/opral/inlang-paraglide-js/issues/483

- Introduced `cookieMaxAge` option to `CompilerOptions`, allowing configuration of cookie expiration time.
- Adjusted tests to verify `max-age` in cookies.
