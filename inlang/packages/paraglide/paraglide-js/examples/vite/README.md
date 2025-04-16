---
imports:
  - https://cdn.jsdelivr.net/npm/@opral/markdown-wc-doc-elements/dist/doc-feature.js
  - https://cdn.jsdelivr.net/npm/@opral/markdown-wc-doc-elements/dist/doc-features.js
---

# Paraglide JS Vite setup

Paraglide JS provides a plugin for Vite. 

If you use Vite in your project, Paraglide JS is almost certainly the best i18n library you can adopt. Check out the [comparison page](/m/gerre34r/library-inlang-paraglideJs/comparison). 

Any frontend framework that works with Vite is automatically supported. No matter if you use React, Vue, Svelte, Solid JS, Preact, or Lit. Paraglide JS does not require framework-specific code. If you are looking for meta framework features, check out [Paraglide JS on the server](https://inlang.com/m/gerre34r/library-inlang-paraglideJs/server-side-rendering).

The source code for the Vite example is [here](https://github.com/opral/monorepo/tree/main/inlang/packages/paraglide/paraglide-js/examples/vite).

## Getting started

```bash
npx @inlang/paraglide-js@latest init
```

Add the vite plugin to your `vite.config.ts`:

```diff
import { defineConfig } from "vite";
+import { paraglideVitePlugin } from "@inlang/paraglide-js";

export default defineConfig({
  plugins: [
+    paraglideVitePlugin({
+      project: "./project.inlang",
+      outdir: "./src/paraglide",
+    }),
  ],
});
```

## Usage

See the [basics documentation](/m/gerre34r/library-inlang-paraglideJs/basics) for more information on how to use Paraglide's messages, parameters, and locale management.
