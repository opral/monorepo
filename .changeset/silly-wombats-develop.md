---
"@inlang/paraglide-sveltekit": minor
"@inlang/paraglide-vite": minor
"@inlang/paraglide-unplugin": minor
"@inlang/paraglide-astro": minor
"@inlang/paraglide-webpack": minor
---

Add `experimentalUseVirtualModules` option to use the `$paraglide` virtual module instead of writing files to disk. Closes https://github.com/opral/inlang-paraglide-js/issues/264

- good for projects that can't have `allowJs: true` in their TypeScript config https://github.com/opral/inlang-paraglide-js/issues/238
- less clutter in the compiled output directory https://github.com/opral/inlang-paraglide-js/issues/189


```diff
import { paraglide } from "@inlang/paraglide-sveltekit/vite"
import { defineConfig } from "vite"

export default defineConfig({
	plugins: [
		paraglide({
			project: "./project.inlang",
			outdir: "./src/lib/paraglide",
+			experimentalUseVirtualModules: true,
		}),
    // ... other vite plugins
	],
})
```

The compiled output will only emit the `runtime.d.ts` and `messages.d.ts` files. 

```diff
.
└── src/
    └── paraglide/
-        ├── messages/
-        │   ├── de.js
-        │   ├── en.js
-        │   ├── fr.js
-        │   └── ...
-        ├── messages.js
+        ├── messages.d.ts
-        └── runtime.js 
+        ├── runtime.d.ts
```