---
title: Getting started
href: /documentation/getting-started
description: Learn on how to get started with inlang.
---

# {% $frontmatter.title %}

{% Callout variant="info" %}

Inlang is in public **alpha**. Read more about our breaking change policy [here](/documentation/breaking-changes).

{% /Callout %}

**One config file and everything works out of the box.**

One single config file named `inlang.config.js` needs to be created at the root of the repository. The `inlang.config.js` file needs to export an `initializeConfig` function that returns an object that conforms to the [config schema](https://github.com/inlang/inlang/blob/main/source-code/core/src/config/schema.ts). More often than not, you want to use a [plugin](/documentation/plugins) that defines parts of the config. Just in case, take a look at the [inlang example repository](https://github.com/inlang/example).

```js
// filename: inlang.config.js

export async function initializeConfig(env) {
	// importing a plugin from github
	const plugin = await env.$import(
		"https://cdn.jsdelivr.net/gh/samuelstroschein/inlang-plugin-json@1.0.0/dist/index.js"
	);
	// most plugins require additional configuration
	const pluginConfig = {
		pathPattern: "./{language}.json",
	};
	// returning the config
	return {
		referenceLanguage: "en",
		languages: ["en", "de"],
		readResources: (args) =>
			// spreading the args and env to forward the call to the plugin
			plugin.readResources({ ...args, ...env, pluginConfig }),
		writeResources: (args) =>
			// spreading the args and env to forward the call to the plugin
			plugin.writeResources({ ...args, ...env, pluginConfig }),
	};
}
```

## Typesafety

If inlang is used in a JavaScript environment like Node or Deno, typesafety can be achieved by installing [@inlang/core](https://www.npmjs.com/package/@inlang/core) and using [JSDoc](https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html) in JavaScript.

```js
/**
 * Using JSDoc to get typesafety.
 *
 * @type {import("@inlang/core/config").InitializeConfig}
 */
export async function initializeConfig(env) {
	// ...
}
```
