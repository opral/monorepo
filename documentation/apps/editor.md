---
title: Web Editor
href: /documentation/apps/editor
description: This is the editor description
---

# {% $frontmatter.title %}

The inlang web editor is a simple and easy to use nocode tool to manage your translations. It let's translators work on translations without having to touch the code and pushes changes directly to your git repository.

### Benefits

- Works with existing translation files
- Manage translations in a simple web interface
- Use common git workflows
- Git based authentication

## Setup

You can use the editor with any git repository. The only requirement is that you have a `inlang.config.js` file in the root of your repository. This file contains the configuration for the editor.

```js
// filename: inlang.config.js

export async function defineConfig(env) {
	const { default: pluginJson } = await env.$import(
		"https://cdn.jsdelivr.net/gh/samuelstroschein/inlang-plugin-json@2/dist/index.js",
	)

	// recommended: standardLintRules to enable linting features
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

To find the correct plugin for your project, check out the [plugin registry](/documentation/plugins/registry).

## How to use

1. Go to the [Editor](https://inlang.com/editor)
2. Paste your repository URL
3. Login in with your GitHub account
4. Fork the repository
5. Make translations
6. Push changes to your forked repository
7. Create a pull request

**Note:** If you have write access, you can skip the forking step and push directly to the repository.

## Features

**Machine translation**

**Linting**

**Filter languages & search**

**Add new languages**
