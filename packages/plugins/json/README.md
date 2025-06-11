# What does this plugin do?

This plugin is a general purpose plugin to read and write messages of json files.

> The plugin uses the inlang SDK v1 API but can be used in V2 projects.
>
> A slight difference is that `languageTag` is called `locale` in v2 projects. Use `languageTag` for this plugin.   

## Manual Installation

> We recommend using the install button, but if you want to do it manually:

- Add this to the modules in your `project.inlang/settings.json`
- Change the `sourceLanguageTag` if needed
- Include existing languagetags in the `languageTags` array

```json
{
	"sourceLanguageTag": "en",
	"languageTags": ["en", "de"],
	"modules": ["https://cdn.jsdelivr.net/npm/@inlang/plugin-json@latest/dist/index.js"],
	"plugin.inlang.json": {
		"pathPattern": "./resources/{languageTag}.json"
	}
}
```

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

# Settings

The plugin offers further configuration options that can be passed as arguments. The following settings exist:

Here is the syntax for the PluginSettings object in TypeScript:

```typescript
type PluginSettings = {
	pathPattern: string | { [key: string]: string }
	variableReferencePattern?: [string] | [string, string]
	ignore?: string[]
}
```

## `pathPattern`

To use our plugin, you need to provide a path to the directory where your language-specific files are stored. Use the dynamic path syntax `{languageTag}` to specify the language name.

### Without namespaces

```json
"plugin.inlang.json": {
	"pathPattern": "./resources/{languageTag}.json"
}
```

### With namespaces

> Does not get created by 'npx @inlang/cli config init'

```json
"plugin.inlang.json": {
	"pathPattern": {
		"website": "./resources/{languageTag}/website.json",
		"app": "./resources/{languageTag}/app.json"
	}
}
```

## `variableReferencePattern`

Defines the pattern for variable references. The default is how i18next suggests the usage of placeholders.

default:

```json
"plugin.inlang.json": {
	"variableReferencePattern": ["{", "}"]
}
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

## `ignore`

An array of strings that are used to ignore certain files. The strings are matched against the file path. If the file path contains the string, the file is ignored.

```json
"plugin.inlang.json": {
	"ignore": ["node_modules", "dist"]
}
```

# Expected behavior

The message IDs are sorted in the order in which they appear in the sourceLanguage file. The nesting or flattening of IDs is detected on a file-by-file basis. If the sourceLanguage file contains nested IDs, the plugin will also create nested IDs in the targetLanguage files. If the sourceLanguage file contains flattened IDs, the plugin will also create flattened IDs in the targetLanguage files.

# Supercharge your i18n workflow by installing the Inlang Visual Studio Code extension (Sherlock)

The plugin can be used with [Sherlock - VS Code extension](https://inlang.com/m/r7kp499g/app-inlang-ideExtension) to extract keys from your code, display inline annotations, have quality checks with [lint rules](https://inlang.com/c/lint-rules) & more. There are only 2 steps to get started:

1. Install: [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=inlang.vs-code-extension).
2. Add the correct syntax matcher:
   - [m function matcher](https://inlang.com/m/632iow21/plugin-inlang-mFunctionMatcher) or
   - [t function matcher](https://inlang.com/m/698iow33/plugin-inlang-tFunctionMatcher)
3. Optional: Add lint rules: https://inlang.com/c/lint-rules
4. 🎉 Done!


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

_Is something unclear or do you have questions? Reach out to us in our [Discord channel](https://discord.gg/CNPfhWpcAa) or open a [Discussion](https://github.com/opral/monorepo/discussions) or an [Issue](https://github.com/opral/monorepo/issues) on [Github](https://github.com/opral/monorepo)._
