---
"@inlang/paraglide-sveltekit": minor
---

Adds a `disableAsyncLocalStorage` option to `i18n.handle`. This allows you to opt out of using the experimental `AsyncLocalStorage` API.

**Warning**
Disabling `AsyncLocalStorage` removes the protection against concurrent requests overriding each other's language state. 

Only opt out if `AsyncLocalStorage` if you are certain your environment does not handle concurrent requests in the same process. For example in Vercel Edge functions or Cloudflare Workers. 

In environments where only one request is processed in a given process disabling `AsyncLocalStorage` can yield performance gains. 

**Example**
```ts
// src/hooks.server.js
import { i18n } from "$lib/i18n"

export const handle = i18n.handle({
    disableAsyncLocalStorage: true // @default = false
})

```