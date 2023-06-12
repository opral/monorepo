---
title: Quick start
href: /documentation/quick-start
description: This is the description foe thw quickstart guide
---

# {% $frontmatter.title %}

An `inlang.config.js` needs to be created at the root of your git repository.

### Using the CLI

Open your repository and execute the [inlang CLI](/documentation/apps/inlang-cli) on the root level:

```
npx @inlang/cli@latest config init
```

### Manual step-by-step guide

1\. Create a new file named `inlang.config.js` at the root of your git repository.

2\. Select a [plugin](/documentation/plugins/registry) and import it in the config:

```js
// filename: inlang.config.js
export async function defineConfig(env) {
	const { default: pluginJson } = await env.$import(
		"https://cdn.jsdelivr.net/gh/samuelstroschein/inlang-plugin-json@2/dist/index.js",
	)

	// recommended to enable linting feature
	const { default: standardLintRules } = await env.$import(
		"https://cdn.jsdelivr.net/gh/inlang/standard-lint-rules@2/dist/index.js",
	)

	return {
		referenceLanguage: "en",
		plugins: [
			pluginJson({
				pathPattern: ".example/{language}.json",
			}),
			standardLintRules(),
		],
	}
}
```

3\. Commit the config and open the repository in the [inlang editor](https://inlang.com/editor)

## Next steps

{% QuickLinks %}

    {% QuickLink
        title="Plugins"
        icon="add-plugin"
        href="/documentation/plugins/registry"
        description="Extend inlang to fit your needs."
    /%}

    {% QuickLink
        title="Badge"
        icon="badge"
        href="/documentation/badge"
        description="Include a dynamic badge in your docs."
    /%}

{% /QuickLinks %}
