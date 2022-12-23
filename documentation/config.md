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
	// importing an external dependency that defines the readBundles
	// and writeBundles functions for typesafe-i18n
	const { readBundles, writeBundles } = await $import(
		"https://cdn.jsdelivr.net/npm/inlang-config-typesafe-i18n@3.2"
	);

	const bundleIds = ["en", "de", "fr"];

	return {
		referenceBundleId: "en",
		bundleIds: bundleIds,
		readBundles: (args) => readBundles({ ...args, bundleIds }),
		writeBundles: writeBundles,
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
export type Config = (args: EnvironmentFunctions) => Promise<ConfigSchema>;
/**
 * Inlang config schema.
 *
 * Read more https://inlang.com/documentation/config
 */
export type ConfigSchema = {
	/**
	 * The bundle (id) that other bundles are validated against.
	 *
	 * In most cases, the reference bundle is `en` (English).
	 */
	referenceBundleId: string;
	/**
	 * Bundle (ids) of this project.
	 *
	 * The bundles must include the reference bundle (id) itself.
	 */
	bundleIds: string[];
	readBundles: (args: EnvironmentFunctions & {}) => Promise<ast.Bundle[]>;
	writeBundles: (
		args: EnvironmentFunctions & {
			bundles: ast.Bundle[];
		}
	) => Promise<void>;
};
```
