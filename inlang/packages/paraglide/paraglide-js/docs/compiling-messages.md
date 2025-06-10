---
imports:
  - https://cdn.jsdelivr.net/npm/@opral/markdown-wc-doc-elements/dist/doc-callout.js
---

# Compiling Messages

There are three ways to invoke the Paraglide JS compiler:

1. Via the Paraglide CLI
2. Via a bundler plugin
3. Programatically

<doc-callout type="tip">
	Bundler plugins are the recommend approach. They are more flexible and can be integrated into your build pipeline.
</doc-callout>

## Via the Paraglide CLI

To compile your messages via the CLI, run the following command:

```bash
npx @inlang/paraglide-js compile --project ./project.inlang --outdir ./src/paraglide
```

Use `--help` to see all available options:

```bash
npx @inlang/paraglide-js compile --help
```

## Via a bundler plugin

Paraglide JS exports bundler plugins via the `paraglide<Bundler>Plugin()` functions.

- `paraglideRollupPlugin`
- `paraglideWebpackPlugin`
- `paraglideVitePlugin`
- `paraglideRspackPlugin`
- `paraglideRolldownPlugin`
- `paraglideEsbuildPlugin`
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

## Programmatically

The Paraglide compiler can be invoked programatically via the `compile` function.

```ts
import { compile } from "@inlang/paraglide-js";

await compile({
	project: "./project.inlang",
	outdir: "./src/paraglide",
});
```

If you need/want to extend the compiler, you can use the lower level `compileProject` function.

```ts
import { compileProject } from "@inlang/paraglide-js";
import { loadProjectFromDirectory } from "@inlang/sdk";

const inlangProject = await loadProjectFromDirectory({
	path: "./project.inlang",
});

const output = await compileProject({
	project: inlangProject,
});

console.log(output);
```
