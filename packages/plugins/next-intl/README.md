# What does the next-intl plugin do?

`next-intl` is agnostic but recommends the JSON format. It also determines how messages are accessed on the frontend. A plugin is required to provide the necessary information to ensure compatibility with the inlang ecosystem and other inlang apps.

## Manual Installation

> We recommend using the install button, but if you want to do it manually:

- Add this to the modules in your `project.inlang/settings.json`
- Change the `sourceLanguageTag` if needed 
- Include existing languagetags in the `languageTags` array

```json
{
	"sourceLanguageTag": "en",
	"languageTags": ["en", "de"], 
	"modules": [
		"https://cdn.jsdelivr.net/npm/@inlang/plugin-next-intl@1/dist/index.js",
  	],
	"plugin.inlang.nextIntl": {
    	"pathPattern": "./messages/{languageTag}.json"
  	}
}
```

# Settings

The plugin offers further configuration options that can be passed as arguments. The following settings exist:

```typescript
type PluginSettings = {
	pathPattern: string
	variableReferencePattern?: [string] | [string, string]
	sourceLanguageFilePath?: string
}
```

You can add this settings also in the `project.inlang/settings.json`:

```json
{
	"sourceLanguageTag": "en",
	"languageTags": ["en", "de"], // add languageTags if needed
	"modules": [
		"https://cdn.jsdelivr.net/npm/@inlang/plugin-next-intl@1/dist/index.js",
  	],
	"plugin.inlang.nextIntl": {
    		// settings
  	}
}
```

## `pathPattern`

To use the plugin, you must provide a path to the directory where your language-specific files are stored. Use the dynamic path syntax `{languageTag}` to specify the language name.

```json
"pathPattern": "./messages/{languageTag}.json"
```

## `variableReferencePattern`

Defines the pattern for variable references. For the default of `next-intl`, you can add this to your plugin settings.

Example:

```json
"variableReferencePattern": ["{", "}"]
```

## `sourceLanguageFilePath`

This setting is optional and should only be used if the file name of your `sourceLanguageTag` does not match your pathPattern structure. For example, if your sourceLanguageTag is `en` but your sourceLanguage file is called `main.json`, you can use this setting to specify the path to the sourceLanguage file. We recommend renaming the file to `en.json` and not using this setting.

```json
"sourceLanguageFilePath": "./resources/main.json"
```

# Install the Inlang Visual Studio Code extension (Sherlock) to supercharge your i18n workflow

The plugin automatically informs [Sherlock](https://inlang.com/m/r7kp499g/app-inlang-ideExtension) how to extract keys and namespaces from your code to display inline annotations. A quick run-through of the most important features can be found [here (loom)](https://www.loom.com/share/68bc13eceb454a8fa69a7cfec5569b8a). Install: [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=inlang.vs-code-extension).

## In-code usage

`t("key")`

With namespaces:

```ts
import {useTranslations} from 'next-intl';
 
function About() {
  const t = useTranslations('About');
  return <h1>{t('title')}</h1>;
}
```

To learn about namespaces and how to use translation functions in your code, you can refer to [next-intl documentation](https://next-intl-docs.vercel.app/docs/usage/messages). The plugin can pars the code and provide the VS Code extension (Sherlock) with this information.

Version `1.3` also supports `getTranslations`.

# Expected behavior

The message IDs are sorted in the order in which they appear in the `sourceLanguage` file. The nesting or flattening of IDs is detected on a file-by-file basis. If the sourceLanguage file contains nested IDs, the plugin will also create nested IDs in the targetLanguage files. If the sourceLanguage file contains flattened IDs, the plugin will also create flattened IDs in the targetLanguage files.


# Contributing

## Getting started

Run the following commands in your terminal (node and npm must be installed):

1. `npm install`
2. `npm run dev`

`npm run dev` will start the development environment, which automatically compiles the [src/index.ts](#getting-started) files to JavaScript ([dist/index.js](#getting-started)), runs tests defined in `*.test.ts` files and watches changes.

## Publishing

Run `npm run build` to generate a build.

The [dist](./dist/) directory is used to distribute the plugin directly via CDN like [jsDelivr](https://www.jsdelivr.com/). Using a CDN works because the inlang config uses dynamic imports to import plugins.

Read the [jsDelivr documentation](https://www.jsdelivr.com/?docs=gh) on importing from GitHub.

---

_Is something unclear or do you have questions? Reach out to us in our [Discord channel](https://discord.gg/gdMPPWy57R) or open a [Discussion](https://github.com/opral/inlang/discussions) or an [Issue](https://github.com/opral/inlang/issues) on [Github](https://github.com/opral/inlang)._
