---
title: Plugins
href: /documentation/plugins
description: Learn more about plugins and how to build them.
---

# {% $frontmatter.title %}

**Plugins allow the customization of inlang's behavior by, for example, defining how resources should be parsed and serialized.**

Plugins are one of the core pillers of the [infrastructure design principle](/documentation/design-principles) of inlang: Use external plugins to adapt inlang to your React, Svelte, Vue, iOS, Android, Flutter, etc. codebase(s).

## Finding plugins

The [awesome inlang](https://github.com/inlang/awesome-inlang) repository contains a list of available (and awesome) plugins for inlang.

## Using plugins

Plugins can be imported via the `$import` [environment function](/documentation/environment-functions) in the inlang config.

```js
// inlang.config.js

export async function defineConfig(env) {
	const plugin = await env.$import(
		"https://cdn.jsdelivr.net/gh/samuelstroschein/inlang-plugin-json/dist/index.js",
	)
}
```

The next steps depent on the plugin. Read the README of the plugin you want to use. For example, [samuelstroschein/inlang-plugin-json](https://github.com/samuelstroschein/inlang-plugin-json) is configured as follows:

```js
// inlang.config.js

export async function defineConfig(env) {
	const plugin = await env.$import(
		"https://cdn.jsdelivr.net/gh/samuelstroschein/inlang-plugin-json/dist/index.js",
	)
	const pluginConfig = {
		pathPattern: "./{language}.json",
	}
	return {
		referenceLanguage: "en",
		languages: ["en", "de"],
		readResources: (args) => plugin.readResources({ ...args, ...env, pluginConfig }),
		writeResources: (args) => plugin.writeResources({ ...args, ...env, pluginConfig }),
	}
}
```

## Writing plugins

Read on how to write plugins in the [plugin template repository](https://github.com/inlang/plugin-template).

{% Figure
  src="https://user-images.githubusercontent.com/72493222/214296359-1ddd2fdb-03f3-4993-a493-9b1a353c4b88.png"
  alt="visualisation of the inlang AST/object"
  caption="Visualisation of the inlang AST/object"
/%}
