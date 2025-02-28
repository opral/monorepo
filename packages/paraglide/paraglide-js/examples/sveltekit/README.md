---
imports:
  - https://cdn.jsdelivr.net/npm/@opral/markdown-wc-doc-elements/dist/doc-callout.js
---

<img src="https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/packages/paraglide/paraglide-js/examples/sveltekit/sveltekit-banner.png" alt="i18n library for SvelteKit" width="10000000px" />

This example shows how to use Paraglide with SvelteKit. 
The source code can be found [here](https://github.com/opral/monorepo/tree/main/inlang/packages/paraglide/paraglide-js/examples/sveltekit).

<doc-callout type="info">
  You can build your own Paraglide JS implementation to achieve SSG. A PR with docs is welcome.
</doc-callout>

| Feature      | Supported |
| ------------ | --------- |
| CSR          | ✅        |
| SSR          | ✅        |
| SSG          | ❌        |
| URLPattern   | ✅        |
| Any Strategy | ✅        |

## Getting started

### Install paraglide js

```bash
npx @inlang/paraglide-js@beta init
```

### Add the `paraglideVitePlugin()` to `vite.config.js`.

```diff
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
+import { paraglideVitePlugin } from '@inlang/paraglide-js';

export default defineConfig({
	plugins: [
		sveltekit(),
+		paraglideVitePlugin({
+			project: './project.inlang',
+			outdir: './src/lib/paraglide',
+			strategy: ['url']
+		})
	]
});
```

### Add `%lang%` to `src/app.html`.

See https://svelte.dev/docs/kit/accessibility#The-lang-attribute for more information.

```diff
<!doctype html>
-<html lang="en">
+<html lang="%lang%">
	...
</html>
```

### Add the `paraglideMiddleware()` to `src/hooks.server.ts`

```typescript
import type { Handle } from '@sveltejs/kit';
import { paraglideMiddleware } from '$lib/paraglide/server';

export const handle: Handle = ({ event, resolve }) => {
	return paraglideMiddleware(event.request, ({ request, locale }) =>
		resolve(
			{ ...event, request },
			{ transformPageChunk: ({ html }) => html.replace('%lang%', locale)}
		)
	);
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

## Usage

See the [basics documentation](/m/gerre34r/library-inlang-paraglideJs/basics) for more information on how to use Paraglide's messages, parameters, and locale management.

## Additional guidance

### Disabling AsyncLocalStorage in serverless environments	

<doc-callout type="info">
If you're deploying to SvelteKit's Edge adapter like Vercel Edge or Cloudflare Pages, you can disable AsyncLocalStorage to avoid issues with Node.js dependencies not available in those environments:

```typescript
export const handle: Handle = ({ event, resolve }) => {
	return paraglideMiddleware(
		event.request, 
		({ request }) => resolve({ ...event, request }),
		{ disableAsyncLocalStorage: true }
	);
};
```

⚠️ Only use this option in serverless environments where each request gets its own isolated runtime context. Using it in multi-request server environments could lead to data leakage between concurrent requests.
</doc-callout>

