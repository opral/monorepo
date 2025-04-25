# Paraglide JS Vite setup

Paraglide JS provides a plugin for Vite. 

If you use Vite in your project, Paraglide JS is almost certainly the best i18n library you can adopt. Check out the [comparison page](/m/gerre34r/library-inlang-paraglideJs/comparison):

- Simple one plugin setup.
- Automatic re-compilation with HMR.
- Supports any framework (React, Vue, Svelte, Solid JS, Preact, Lit).
- Supports any Vite-based metaframework (React Router, TanStack Start, SvelteKit, Nuxt, ...). 

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

## I18n routing

Check out [Paraglide JS on the server](https://inlang.com/m/gerre34r/library-inlang-paraglideJs/server-side-rendering) for i18n routing.

## Example

A full example can be found [here](https://github.com/opral/monorepo/tree/main/inlang/packages/paraglide/paraglide-js/examples/vite).
