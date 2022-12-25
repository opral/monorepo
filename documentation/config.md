---
title: Config
href: /documentation/config
description: The reference for the config.
---

# {% $frontmatter.title %}

**The config powers all components of inlang.**

The config must be named `inlang.config.js`, exist at the root of a repository, and export an async function named `config`. Importing external modules is only permitted via the `$import` [environment function](/documentation/environment-functions) within the scope of the exported `config` function.

## Example

```ts
// filename: inlang.config.js

/**
 * Using JSDoc to get typesafety.
 * Note: the npm package @inlang/core must be installed.
 * @type {import("@inlang/core/config").Config}
 */
export async function config({ $import }) {
	// importing an external dependency that defines the readResources
	// and writeResources functions for typesafe-i18n
	const { readResources, writeResources } = await $import(
		"https://cdn.jsdelivr.net/npm/inlang-config-typesafe-i18n@3.2"
	);

	return {
		referenceLanguage: "en",
		languages: ["en", "fr", "de"],
		readResources: readResources,
		writeResources: writeResources,
	};
}
```

## Reference

_Up-to-date implemenation can be found [here](https://github.com/inlang/inlang/blob/main/source-code/core/src/config/schema.ts)_

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
	 * In most cases, the reference lanugage is `en` (English).
	 */
	referenceLanguage: Iso639LanguageCode;
	/**
	 * Languages of this project.
	 *
	 * The languages must include the reference language itself.
	 */
	languages: Iso639LanguageCode[];
	readResources: (args: { config: Config }) => Promise<ast.Resource[]>;
	writeResources: (args: {
		config: Config;
		resources: ast.Resource[];
	}) => Promise<void>;
};
```
