---
imports:
  - https://cdn.jsdelivr.net/npm/@opral/markdown-wc-doc-elements/dist/doc-callout.js
---

# SvelteKit example

This example shows how to use Paraglide with SvelteKit. The source code can be found [here](https://github.com/opral/monorepo/tree/main/inlang/packages/paraglide/paraglide-js/examples/sveltekit).

## Getting started

### Install paraglide js

```bash
npx @inlang/paraglide-js@beta init
```

### Add the serverMiddleware to `src/hooks.server.ts`

```typescript
import type { Handle } from '@sveltejs/kit';
import { serverMiddleware } from '$lib/paraglide/runtime';

export const handle: Handle = ({ event, resolve }) => {
	return serverMiddleware(event.request, ({ request }) => resolve({ ...event, request }));
};
```

### Add a reroute hook in `src/hook.ts`

```typescript
import type { Reroute } from '@sveltejs/kit';
import { deLocalizeUrl } from '$lib/paraglide/runtime';

export const reroute: Reroute = (request) => {
	return deLocalizeUrl(request.url).pathname;
};
```

### Done :)

Check out https://inlang.com/m/gerre34r/library-inlang-paraglideJs/getting-started on how to use Paraglide Js.

## Features of the example

| Feature      | Supported |
| ------------ | --------- |
| CSR          | ✅        |
| SSR          | ✅        |
| SSG          | ❌        |
| URLPattern   | ✅        |
| Any Strategy | ✅        |

## Additional guidance

### Disabling AsyncLocalStorage in serverless environments	

<doc-callout type="info">
If you're deploying to SvelteKit's Edge adapter like Vercel Edge or Cloudflare Pages, you can disable AsyncLocalStorage to avoid issues with Node.js dependencies not available in those environments:

```typescript
export const handle: Handle = ({ event, resolve }) => {
	return serverMiddleware(
		event.request, 
		({ request }) => resolve({ ...event, request }),
		{ disableAsyncLocalStorage: true }
	);
};
```

⚠️ Only use this option in serverless environments where each request gets its own isolated runtime context. Using it in multi-request server environments could lead to data leakage between concurrent requests.
</doc-callout>