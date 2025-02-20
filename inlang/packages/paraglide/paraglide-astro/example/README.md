# Astro Example

## Setup

### 1. If you have not initialized Paraglide JS yet, run:

```bash
npx @inlang/paraglide-js@beta init
```

### 2. Add the vite plugin to the `astro.config.mjs` file:

```diff
import { defineConfig } from "astro/config";
import { paraglideVitePlugin } from "@inlang/paraglide-js";

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
