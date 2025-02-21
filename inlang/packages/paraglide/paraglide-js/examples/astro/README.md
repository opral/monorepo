---
imports:
  - https://cdn.jsdelivr.net/npm/@opral/markdown-wc-doc-elements/dist/doc-callout.js
---

# Astro SSR Example

This example demonstrates how to use Paraglide JS with Astro in SSR mode. The source code can be found [here](https://github.com/opral/monorepo/tree/main/inlang/packages/paraglide/paraglide-js/examples/astro).

<doc-callout type="tip">Pull requests that improve this example are welcome.</doc-callout>

## Setup

### 1. If you have not initialized Paraglide JS yet, run:

```bash
npx @inlang/paraglide-js@beta init
```

### 2. Add the vite plugin to the `astro.config.mjs` file and set `output` to `server`:

```diff
import { defineConfig } from "astro/config";
+import { paraglideVitePlugin } from "@inlang/paraglide-js";
+import node from "@astrojs/node";

export default defineConfig({
  // ... other
+	vite: {
+		plugins: [
+			paraglideVitePlugin({
+				project: "./project.inlang",
+				outdir: "./src/paraglide",
+			}),
+		],
	},
+  output: "server",
+  adapter: node,
});
```

### 3. Create or add the paraglide js server middleware to the `src/middleware.ts` file:

```diff
import { serverMiddleware } from "./paralide/runtime.js";

export const onRequest = defineMiddleware((context, next) => {
+	return serverMiddleware(context.request, () => next());
});
```

You can read more about about Astro's middleware [here](https://docs.astro.build/en/guides/middleware).

## Features of the example

<doc-callout type="info">You can integrate Paraglide JS yourself to achieve SSG. PR with an example is welcome.</doc-callout>

| Feature      | Supported |
| ------------ | --------- |
| CSR          | ✅        |
| SSR          | ✅        |
| SSG          | ❌        |
| URLPattern   | ✅        |
| Any Strategy | ✅        |