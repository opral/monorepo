---
"@inlang/paraglide-js": major
---

This will make `extractLocaleFromRequest` asynchronous. This means that it will return a Promise and if this is being used in code, all instances will need to be awaited.

The reason this change was made was because if a user supplied a custom server strategy via the `defineCustomServerStrategy` and defined a `getLocale` that made an asynchronous database call for example, this would mean that the `extractRequestFromLocale` would have to be made asynchronous.

Users should await `extractLocaleFromRequest` if it is used in code.

Closes https://github.com/opral/inlang-paraglide-js/issues/527
