---
"@inlang/paraglide-sveltekit": patch
---

fix: Preserve query parameters when redirecting ([inlang-paraglide-js#168](https://github.com/opral/inlang-paraglide-js/issues/168))

`i18n.handle` redirects requests if the pathname does not fit the detected language. Previously this would remove any query parameters from the URL. This is no longer the case.

```ts
redirect(303, "/login?from=/home") // will be redirected to /<lang>/login?from=/home
``` 