# Astro Example

Initialize Paraglide JS:

```
npx @inlang/paraglide-js@latest init
```

Add the vite plugin to the Astro config: 

```diff
import { defineConfig } from 'astro/config';
+ import { paraglideVitePlugin } from "@inlang/paraglide-js";

// https://astro.build/config
export default defineConfig({
+	vite: {
+		plugins: [
+			paraglideVitePlugin({
+				project: "./project.inlang",
+				outdir: "./src/paraglide",
+			}),
+		],
+	},
});
```