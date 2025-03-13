---
imports:
  - https://cdn.jsdelivr.net/npm/@opral/markdown-wc-doc-elements/dist/doc-feature.js
  - https://cdn.jsdelivr.net/npm/@opral/markdown-wc-doc-elements/dist/doc-features.js
---

# Paraglide JS Vite example

This example shows how to use Paraglide with Vite. 

Any frontend framework that works with Vite is automatically supported. Paraglide JS does not require framework specific code. If you are looking for metaframework features, check out [Paraglide JS on the server](https://inlang.com/m/gerre34r/library-inlang-paraglideJs/server-side-rendering).

<doc-features>
  <doc-feature title="JavaScript" icon="devicon:javascript" color="#f0f0f0" text-color="#000"></doc-feature>
  <doc-feature title="TypeScript" icon="devicon:typescript" color="#f0f0f0" text-color="#000"></doc-feature>
  <doc-feature title="React" icon="devicon:react" color="#f0f0f0" text-color="#000"></doc-feature>
  <doc-feature title="Vue" icon="devicon:vuejs" color="#e0e0e0" text-color="#111"></doc-feature>
  <doc-feature title="Svelte" icon="devicon:svelte" color="#f0f0f0" text-color="#000"></doc-feature>
  <doc-feature title="Solid" icon="devicon:solidjs" color="#f0f0f0" text-color="#000"></doc-feature>
  <doc-feature title="Preact" icon="devicon:preact" color="#f0f0f0" text-color="#000"></doc-feature>
  <doc-feature title="Lit" icon="logos:lit" color="#f0f0f0" text-color="#000"></doc-feature>
</doc-features>

The source code is [here](https://github.com/opral/monorepo/tree/main/inlang/packages/paraglide/paraglide-js/examples/vite).

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
