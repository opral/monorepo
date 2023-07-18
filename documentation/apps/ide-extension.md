---
title: IDE Extension for translating with inlang
shortTitle: IDE Extension
href: /documentation/apps/ide-extension
description: With the inlang IDE extension you can translate your content directly in your IDE and more.
---

# {% $frontmatter.shortTitle %}

The VS Code extension provides a seamless integration of Inlang's globalization infrastructure into Visual Studio Code. It allows you to translate your content directly in your IDE, extract messages and more.

{% QuickLinks %}

    {% QuickLink
        title="Download for VSCode"
        icon="vscode"
        href="https://marketplace.visualstudio.com/items?itemName=inlang.vs-code-extension"
        description="Download the IDE extension from the VSCode marketplace."
    /%}

{% /QuickLinks %}

## Benefits

- 💬 **Context Tooltips** for not having to switch files
- ✂️ **Extract Messages** easily
- 📝 **Message Linting** for ensuring quality
- 🔎 **Inline Annotations** for translations
- 🔁 **Automatic Updates** for synced resources

## Features

### Context Tooltips

See translations and edit them directly in your code. No more back-and-forth looking into the translation files themselves.

![Context Tooltips](https://cdn.jsdelivr.net/gh/inlang/inlang/assets/ide-extension/tooltip.gif)

### Extract Messages (translations)

Extract Messages (translations) via the `Inlang: Extract Message` code action.

![Extract Messages](https://cdn.jsdelivr.net/gh/inlang/inlang/assets/ide-extension/extract.gif)

### Message Linting

Get notified about missing translations and other issues directly in your IDE.

![Message Linting](https://cdn.jsdelivr.net/gh/inlang/inlang/assets/ide-extension/lint.gif)

### Inline Annotations

See translations directly in your code. No more back-and-forth looking into the translation files themselves.

![Inline Annotations](https://cdn.jsdelivr.net/gh/inlang/inlang/assets/ide-extension/inline.gif)

### Update Translations

Translations from the resource files are automatically updated when you change the source text.

![Update Translations](https://cdn.jsdelivr.net/gh/inlang/inlang/assets/ide-extension/update.gif)

## Installation

Create a `inlang.config.js` in the **root** of your project. You can use the following template hen using json files as translation files, if not, please look for other [supported resource file types](https://github.com/inlang/ecosystem#resources):

```js
export async function defineConfig(env) {
	const { default: jsonPlugin } = await env.$import(
		"https://cdn.jsdelivr.net/npm/@inlang/plugin-json@3/dist/index.js",
	)

	return {
		referenceLanguage: "en",
		plugins: [
			jsonPlugin({
				pathPattern: "./path/to/languages/{language}.json",
			}),
		],
	}
}
```

#### Requirements:

- Requires VS Code version 1.80.1 or higher.
- Node.js version 16.17.1 or higher.

## Usage

Just _highlight/select_ the text you want and hit `cmd .` or `ctrl +` (Quick Fix / Yellow Bulb) to open the **translate dialog** to provide a id for it.

Hover over the message to see the tooltip with the translation.

If something isn't working as expected, please join our [Discord](https://discord.gg/gdMPPWy57R) or [create an issue](https://github.com/inlang/inlang/issues/new/choose). We are happy to help!

## Configuration

You can configure the extension to your needs by defining the `ideExtension` property in the config.

| Property                   | Type    | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| -------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `messageReferenceMatchers` | `Array` | An array of functions that define matchers for message references inside the code. Each function takes an argument of type `{ documentText: string }` and returns a promise that resolves to an array of message references (as defined by the `messageReferenceSchema`).                                                                                                                                                                                           |
| `extractMessageOptions`    | `Array` | An array of objects that define options for extracting messages. Each object has a property `callback` that is a function which is called when the user finishes the message extraction command. The `callback` function takes two arguments of type `string`: `messageId` (the message identifier entered by the user) and `selection` (the text which was extracted), and returns a `string` that represents the code which should be inserted into the document. |
| `documentSelectors`        | `Array` | An array of [VS Code DocumentSelectors](https://code.visualstudio.com/api/references/document-selector) that specify for which files/programming languages the extension should be activated. Each document selector is an object with optional properties `language`, `scheme`, `pattern`, and `notebookType`.                                                                                                                                                     |

For this example, the extension parses strings with a `t` translation function & gives the according extract options `{t("messageID")}` & `t("messageID")`.
You can fully customize this behavior with the example code below.

If your are using a different translation function, you can use the following code as a template:

```js
export async function defineConfig(env) {
	const { default: jsonPlugin } = await env.$import(
		"https://cdn.jsdelivr.net/npm/@inlang/plugin-json@3/dist/index.js",
	)

	return {
		referenceLanguage: "en",
		plugins: [
			jsonPlugin({
				pathPattern: "./path/to/languages/{language}.json",
			}),
		],
		ideExtension: {
			// ... your configuration here
		},
	}
}
```
