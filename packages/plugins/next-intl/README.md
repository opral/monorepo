# next-intl Plugin for Inlang

This plugin enables your inlang project to read and write [next-intl](https://next-intl-docs.vercel.app/) translation files.

![next-intl plugin for inlang](https://cdn.jsdelivr.net/npm/@inlang/plugin-next-intl@latest/assets/banner.svg)

## Why use this plugin?

If you're using next-intl for internationalization in Next.js, this plugin lets you:

- **Manage translations** with [Fink](https://inlang.com/m/tdozzpar/app-inlang-finkLocalizationEditor) – a translation editor for collaborating with translators
- **Get inline previews** with [Sherlock](https://inlang.com/m/r7kp499g/app-inlang-ideExtension) – a VS Code extension that shows translations directly in your code
- **Lint translations** with [inlang CLI](https://inlang.com/m/2qj2w8pu/app-inlang-cli) – catch missing translations, unused keys, and other issues
- **Automate workflows** with the inlang SDK – build custom tooling around your translations

## How it works

The plugin reads and writes next-intl JSON files, preserving your existing file structure (nested or flat keys). It also tells Sherlock how to detect `t()`, `useTranslations()`, and `getTranslations()` calls in your code.

# Supported next-intl Features

| Feature | Status | Notes |
|---------|--------|-------|
| Basic key-value pairs | ✅ Supported | Fully working |
| Nested keys | ✅ Supported | Auto-detects flat vs nested structure |
| Variable interpolation | ✅ Supported | `{variable}` with customizable patterns |
| Rich text | ⚠️ Partial | Tags are treated as text |
| Plurals (ICU) | ❌ Not supported | ICU message format not parsed |
| Select (ICU) | ❌ Not supported | ICU message format not parsed |

## Version Compatibility

- **next-intl v3.x**: Full support
- **next-intl v2.x**: Full support

## Installation

- Add this to the modules in your `project.inlang/settings.json`
- Change the `sourceLanguageTag` if needed
- Include existing language tags in the `languageTags` array

```json
{
	"sourceLanguageTag": "en",
	"languageTags": ["en", "de"],
	"modules": [
		"https://cdn.jsdelivr.net/npm/@inlang/plugin-next-intl@latest/dist/index.js"
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

## `pathPattern`

To use the plugin, you must provide a path to the directory where your language-specific files are stored. Use the dynamic path syntax `{languageTag}` to specify the language name.

```json
"pathPattern": "./messages/{languageTag}.json"
```

## `variableReferencePattern`

Defines the pattern for variable references. The default matches next-intl's format.

```json
"variableReferencePattern": ["{", "}"]
```

## `sourceLanguageFilePath`

This setting is optional and should only be used if the file name of your `sourceLanguageTag` does not match your pathPattern structure. For example, if your sourceLanguageTag is `en` but your sourceLanguage file is called `main.json`, you can use this setting to specify the path to the sourceLanguage file. We recommend renaming the file to `en.json` and not using this setting.

```json
"sourceLanguageFilePath": "./resources/main.json"
```

# In-code usage

Basic usage:

`t("key")`

With namespaces:

```ts
import {useTranslations} from 'next-intl';

function About() {
  const t = useTranslations('About');
  return <h1>{t('title')}</h1>;
}
```

Server components with `getTranslations`:

```ts
import {getTranslations} from 'next-intl/server';

export default async function Page() {
  const t = await getTranslations('About');
  return <h1>{t('title')}</h1>;
}
```

To learn about namespaces and how to use translation functions in your code, refer to the [next-intl documentation](https://next-intl-docs.vercel.app/docs/usage/messages).

# Expected behavior

## Structure and Ordering

The **source language file determines the structure** for all other locale files:

- **Key ordering**: Messages are sorted in the order they appear in the source language file
- **Nesting vs flat**: Detected per-file from the source language. If your `en.json` uses nested keys, all other locales will use nested keys too
- **New keys**: When you add translations for other locales, they follow the source file's structure

### Example

If your source language (`en.json`) looks like this:
```json
{
  "About": {
    "title": "About us",
    "description": "Learn more about our company"
  }
}
```

Then your target language (`de.json`) will be written in the same nested structure:
```json
{
  "About": {
    "title": "Über uns",
    "description": "Erfahren Sie mehr über unser Unternehmen"
  }
}
```

# Limitations

The following next-intl features are **not supported** by this plugin:

| Feature | Limitation |
|---------|------------|
| **ICU message format** | Plurals, select, and other ICU syntax are not parsed |
| **Rich text formatting** | Tags like `<bold>text</bold>` are treated as plain text |
| **Nested `t()` calls** | References like `{t('other.key')}` are not resolved |

# Troubleshooting

## Keys appear duplicated or out of order

**Cause**: The source language file structure doesn't match what the plugin expects.

**Solution**:
1. Ensure your source language file (e.g., `en.json`) is valid JSON
2. Check that the file structure is consistent (all nested or all flat)
3. The source language file is the "source of truth" for key ordering

## Sherlock not detecting translation keys

**Cause**: Non-standard function names or unsupported file types.

**Solution**:
- Use standard function calls: `t("key")`, `useTranslations()`, or `getTranslations()`
- Supported file types: `.ts`, `.tsx`, `.js`, `.jsx`

## Changes not appearing in target language files

**Cause**: Target files don't exist or path pattern is incorrect.

**Solution**:
1. Verify your `pathPattern` matches your file structure
2. Check that the `{languageTag}` placeholder is in the correct position
3. Directories are created automatically, but the language tag must be in your `languageTags` array

# Contributing

## Getting started

Run the following commands in your terminal (node and npm must be installed):

1. `npm install`
2. `npm run dev`

`npm run dev` will start the development environment, which automatically compiles the [src/index.ts](#getting-started) files to JavaScript ([dist/index.js](#getting-started)), runs tests defined in `*.test.ts` files and watches changes.
