---
title: Custom Plugins
href: /documentation/plugins/custom-plugins
description: This is the custom plugins description
---

# {% $frontmatter.title %}

Plugins allow the customization of inlang's behavior by, for example, defining how resources should be parsed and serialized.

## Finding plugins

The [plugin registry](/documentation/plugins/registry) contains a list of available (and awesome) plugins for inlang.

## Using plugins

Plugins can be imported via the `$import` [environment function](/documentation/inlang-environment) in the inlang config.

```js
// inlang.config.js

export async function defineConfig(env) {
	const { default: plugin } = await env.$import(
		"https://cdn.jsdelivr.net/gh/samuelstroschein/inlang-plugin-json/dist/index.js",
	)
	return {
		plugins: [plugin()],
	}
}
```

## Writing plugins

Use the following template to create your plugin [plugin-template](https://github.com/inlang/plugin-template).

```ts
const myPlugin = createPlugin(() => {
	return {
		id: "inlang.plugin-template",
		config: () => {
			return {
				languages: ["en", "de"],
			}
		},
	}
})
```
