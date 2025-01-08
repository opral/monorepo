---
imports: 
  - https://cdn.jsdelivr.net/npm/@opral/markdown-wc-doc-elements/dist/doc-important.js
---

# Compiling messages

There are three ways to invoke the Paraglide JS compiler:

1. Via the Paraglide CLI
2. Via a bundler plugin 
3. Programatically

<doc-important title="Bundler plugins are the recommended approach" description="Bundler plugins automatically take care of watching, building, and are the easiest to use."></doc-important>


## Via the Paraglide CLI

To compile your messages via the CLI, run the following command:

```bash
npx @inlang/paraglide-js compile --project ./project.inlang --outdir ./src/paraglide
```

## Via a bundler plugin

Paraglide JS exports bundler plugins via the `paraglide<Bundler>Plugin()` functions.

- `paraglideRollupPlugin`
- `paraglideWebpackPlugin`
- `paraglideVitePlugin`
- ... and more plugins supported by [unplugin](https://unplugin.unjs.io/)

### Vite example

```ts
import { defineConfig } from "vite";
import { paraglideVitePlugin } from "@inlang/paraglide-js";

export default defineConfig({
	plugins: [
		paraglideVitePlugin({
			project: "./project.inlang",
			outdir: "./src/paraglide",
		}),
	],
});
```

## Programatically

In case you have a special use case, or want to extend Paraglide JS, you can also invoke the compiler programatically.

```ts
import { compile } from "@inlang/paraglide-js";

await compile({
  project: "./project.inlang",
  outdir: "./src/paraglide",
});
```