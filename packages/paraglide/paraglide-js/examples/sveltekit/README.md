---
imports:
  - https://cdn.jsdelivr.net/npm/@opral/markdown-wc-doc-elements/dist/doc-callout.js
---

<img src="https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/packages/paraglide/paraglide-js/examples/sveltekit/sveltekit-banner.png" alt="i18n library for SvelteKit" width="10000000px" />

This example shows how to use Paraglide with SvelteKit.The source code can be found [here](https://github.com/opral/monorepo/tree/main/inlang/packages/paraglide/paraglide-js/examples/sveltekit).

| Feature      | Supported |
| ------------ | --------- |
| CSR          | ✅        |
| SSR          | ✅        |
| SSG          | ✅        |
| URLPattern   | ✅        |
| Any Strategy | ✅        |

## Getting started

### Install paraglide js

```bash
npx @inlang/paraglide-js@latest init
```

### Add the `paraglideVitePlugin()` to `vite.config.js`.

<doc-callout type="info">
	You can define strategy however you need. 
</doc-callout>

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
+			strategy: ['url', 'cookie', 'baseLocale'],
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

// creating a handle to use the paraglide middleware
const paraglideHandle: Handle = ({ event, resolve }) =>
	paraglideMiddleware(event.request, ({ request: localizedRequest, locale }) => {
		event.request = localizedRequest;
		return resolve(event, {
			transformPageChunk: ({ html }) => {
				return html.replace('%lang%', locale);
			}
		});
	});

export const handle: Handle = paraglideHandle;
```

### Add a reroute hook in `src/hooks.ts`

```typescript
import type { Reroute } from '@sveltejs/kit';
import { deLocalizeUrl } from '$lib/paraglide/runtime';

export const reroute: Reroute = (request) => {
	return deLocalizeUrl(request.url).pathname;
};
```

## Usage

See the [basics documentation](/m/gerre34r/library-inlang-paraglideJs/basics) for more information on how to use Paraglide's messages, parameters, and locale management.

## Static site generation (SSG)

Enable [pre-renderering](https://svelte.dev/docs/kit/page-options#prerender) by adding the following line to `routes/+layout.ts`:

```diff
// routes/+layout.ts
+export const prerender = true;
```

Then add "invisble" anchor tags in `routes/+layout.svelte` to generate all pages during build time. SvelteKit crawls the anchor tags during the build and is, thereby, able to generate all pages statically.

```diff
<script>
	import { page } from '$app/state';
+	import { locales, localizeHref } from '$lib/paraglide/runtime';
</script>

<slot></slot>

+<div style="display:none">
+	{#each locales as locale}
+		<a href={localizeHref(page.url.pathname, { locale })}>{locale}</a>
+	{/each}
+</div>
```

## Troubleshooting

### Disabling AsyncLocalStorage in serverless environments

If you're deploying to SvelteKit's Edge adapter like Vercel Edge or Cloudflare Pages, you can disable AsyncLocalStorage to avoid issues with Node.js dependencies not available in those environments:

<doc-callout type="warning">
	⚠️ Only use this option in serverless environments where each request gets its own isolated runtime context. Using it in multi-request server environments could lead to data leakage between concurrent requests.
</doc-callout>

```diff
export default defineConfig({
	plugins: [
		sveltekit(),
		paraglideVitePlugin({
			project: './project.inlang',
			outdir: './src/lib/paraglide',
+			disableAsyncLocalStorage: true
		})
	]
});
```

### No locale OR different locale when calling messages outside of .server.ts files

If you call messages on the server outside of load functions or hooks, you might run into issues with the locale not being set correctly. This can happen if you call messages outside of a request context.

```typescript
// hello.ts
import { m } from './paraglide/messages.js';

// 💥 there is no url in this context to retrieve
//    the locale from.
console.log(m.hello());
```
