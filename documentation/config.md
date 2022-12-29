---
title: Config
href: /documentation/config
description: The reference for the config.
---

# {% $frontmatter.title %}

**The config powers all apps, plugins, and automations. One config file to cover all localization needs (see [design principles](/documentation/design-principles)).**

The config must be named `inlang.config.js`, exist at the root of a repository, and export an async function named `initializeConfig`. Importing external modules is only permitted via the `$import` [environment function](/documentation/environment-functions) within the scope of the exported `initializeConfig` function. Read the [plugin](/documentation/plugins) documenation for more information on how to use external modules.

## Example

```ts
// filename: inlang.config.js

/**
 * Using JSDoc to get typesafety.
 * Note: the npm package @inlang/core must be installed.
 * @type {import("@inlang/core/config").InitializeConfig}
 */
export async function initializeConfig(env) {
	// importing a plugin from github
	const plugin = await env.$import(
		"https://cdn.jsdelivr.net/gh/samuelstroschein/inlang-plugin-json/dist/index.js"
	);
	const pluginConfig = {
		pathPattern: "./{language}.json",
	};
	return {
		referenceLanguage: "en",
		languages: ["en", "de"],
		readResources: (args) =>
			plugin.readResources({ ...args, ...env, pluginConfig }),
		writeResources: (args) =>
			plugin.writeResources({ ...args, ...env, pluginConfig }),
	};
}
```

## Reference

_Up-to-date implementation can be found [in the repository](https://github.com/inlang/inlang/blob/main/source-code/core/src/config/schema.ts)._

```ts
/**
 * The environment functions.
 *
 * Read more https://inlang.com/documentation/environment-functions
 */
export type EnvironmentFunctions = {
	$fs: $fs;
	$import: $import;
};

/**
 * The inlang config function.
 *
 * Read more https://inlang.com/documentation/config
 */
export type InitializeConfig = (args: EnvironmentFunctions) => Promise<Config>;

/**
 * Inlang config schema.
 *
 * Read more https://inlang.com/documentation/config
 */
export type Config = {
	/**
	 * The reference language that other messages are validated against.
	 *
	 * The language must be an ISO-639-1 string. See https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes.
	 * In most cases, the reference lanugage is `en` (English).
	 */
	referenceLanguage: string;
	/**
	 * Languages of this project.
	 *
	 * The language must be an ISO-639-1 string and include the reference language itself.
	 * See https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes.
	 */
	languages: string[];
	readResources: (args: { config: Config }) => Promise<ast.Resource[]>;
	writeResources: (args: {
		config: Config;
		resources: ast.Resource[];
	}) => Promise<void>;
};
```
