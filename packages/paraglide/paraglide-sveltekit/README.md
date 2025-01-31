[![Inlang-ecosystem compatibility badge](https://cdn.jsdelivr.net/gh/opral/monorepo@main/inlang/assets/md-badges/inlang.svg)](https://inlang.com)

## Getting Started

Initialize an inlang project and install the paraglide sveltekit adapter:

```bash
npx @inlang/paraglide-js@beta init
npm i @inlang/paraglide-sveltekit@beta
```

Add the vite plugin and adapter to your `vite.config.js`:


```diff
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
+import { paraglideSveltekit } from '@inlang/paraglide-sveltekit';

export default defineConfig({
	plugins: [
		sveltekit(),
+		paraglideSveltekit({
+			project: './project.inlang',
+			outdir: './src/lib/paraglide'
+		})
	]
});
```

Add the handle hook to `/src/hooks.server.ts`:

```ts
import type { Handle } from '@sveltejs/kit';
import * as paraglideAdapter from '$lib/paraglide/adapter';

export const handle: Handle = paraglideAdapter.handle;
```

Add the reroute hook to `/src/hooks.ts`:

```ts
import type { Reroute } from '@sveltejs/kit';
import * as paraglideAdapter from '$lib/paraglide/adapter';

export const reroute: Reroute = paraglideAdapter.reroute;
```
