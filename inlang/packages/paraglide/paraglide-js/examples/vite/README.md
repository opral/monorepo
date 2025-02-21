# Paraglide JS Vite example

This example shows how to use Paraglide with Vite. The source code can be found [here](https://github.com/opral/monorepo/tree/main/inlang/packages/paraglide/paraglide-js/examples/vite).

## Getting started

```bash
npx @inlang/paraglide-js@beta init
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

Done :)
