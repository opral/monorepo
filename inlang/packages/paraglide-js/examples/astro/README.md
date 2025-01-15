---
imports: 
  - https://cdn.jsdelivr.net/npm/@opral/markdown-wc-doc-elements/dist/doc-callout.js
---

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

Enable Astro's i18n routing in the Astro config:

<doc-callout type="info">
  Importing `baseLocale` and `availableLocales` from the Paraglide runtime 
  does not work here because the compiler did not run yet. 
</doc-callout>

```diff
import { defineConfig } from "astro/config";
import { paraglideVitePlugin } from "@inlang/paraglide-js";

export default defineConfig({
+	i18n: {
+		defaultLocale: "en",
+		locales: ["en", "de"],
+	},
	vite: {
		plugins: [
      paraglideVitePlugin(...)
    ]
	},
});
```