#  What does this plugin do?

This plugin is a general purpose plugin to read and write messages of json files. It also determines how translation functions and namespaces are parsed and handled by the IDE extension.

## Example

_messages/en.json_

```json
{
	"hello": "Hello {name}!",
	"loginButton": "Login"
}
```

_messages/de.json_

```json
{
	"hello": "Hallo {name}!",
	"loginButton": "Anmelden"
}
```

# How to use

```json
// filename: project.inlang.json

{
	"$schema": "https://inlang.com/schema/project-settings",
	"sourceLanguageTag": "en",
	"languageTags": ["en", "de", "it"],
	"modules": [
		"https://cdn.jsdelivr.net/npm/@inlang/plugin-json@4/dist/index.js"
	],
	"plugin.inlang.json": {
		"pathPattern": "./resources/{languageTag}.json"
	}
}
```

# Settings

The plugin offers further configuration options that can be passed as arguments. The following settings exist:

Here is the syntax for the PluginSettings object in TypeScript:

```typescript
type PluginSettings = {
	pathPattern: string | { [key: string]: string }
	variableReferencePattern?: [string] | [string, string]
}
```

## `pathPattern`

To use our plugin, you need to provide a path to the directory where your language-specific files are stored. Use the dynamic path syntax `{languageTag}` to specify the language name.

### Without namespaces

```json
"pathPattern": "./resources/{languageTag}.json"
```

### With namespaces

> Does not get created by 'npx @inlang/cli config init'

```json
"pathPattern": {
	"website": "./resources/{languageTag}/website.json",
	"app": "./resources/{languageTag}/app.json"
}
```

## `variableReferencePattern`

Defines the pattern for variable references. The default is how i18next suggests the usage of placeholders.

default:

```json
"variableReferencePattern": ["{", "}"]
```

**Common use cases**

| Placeholder       | Pattern        |
| ----------------- | -------------- |
| `{placeholder}`   | `["{", "}"]`   |
| `{{placeholder}}` | `["{{", "}}"]` |
| `${placeholder}`  | `["${", "}"]`  |
| `%placeholder`    | `["%"]`        |
| `[placeholder]`   | `["[", "]"]`   |
| `:placeholder`    | `[":"]`        |

<br>

# Expected behavior

The message IDs are sorted in the order in which they appear in the sourceLanguage file. The nesting or flattening of IDs is detected on a file-by-file basis. If the sourceLanguage file contains nested IDs, the plugin will also create nested IDs in the targetLanguage files. If the sourceLanguage file contains flattened IDs, the plugin will also create flattened IDs in the targetLanguage files.

# Contributing

## Getting started

Run the following commands in your terminal (node and npm must be installed):

1. `npm install`
2. `npm run dev`

`npm run dev` will start the development environment which automatically compiles the [src/index.ts](#getting-started) files to JavaScript ([dist/index.js](#getting-started)), runs tests defined in `*.test.ts` files and watches changes.

## Publishing

Run `npm run build` to generate a build.

The [dist](./dist/) directory is used to distribute the plugin directly via CDN like [jsDelivr](https://www.jsdelivr.com/). Using a CDN works because the inlang config uses dynamic imports to import plugins.

Read the [jsDelivr documentation](https://www.jsdelivr.com/?docs=gh) on importing from GitHub.

---

_Is something unclear or do you have questions? Reach out to us in our [Discord channel](https://discord.gg/9vUg7Rr) or open a [Discussion](https://github.com/inlang/monorepo/discussions) or an [Issue](https://github.com/inlang/monorepo/issues) on [Github](https://github.com/inlang/monorepo)._
