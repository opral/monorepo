---
"@inlang/paraglide-js": major
---

Provide functions for getting the preferred language on server and client.

This defines two new functions for getting the preferred language:

- `extractLocaleFromHeader`: Extracts the locale from the accept-language header on the server.
- `extractLocaleFromNavigator`: Extracts the locale from the navigator.languages array on the client.

The code was already present in the `@inlang/paraglide-js` package, but it was not exported. Now it is exported so that
it can be used in custom strategies.
