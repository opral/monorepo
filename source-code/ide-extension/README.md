<div>
    <p align="center">
        <img width="300" src="https://cdn.jsdelivr.net/gh/inlang/inlang/assets/logo-white-background.png"/>
    </p>
    <h4 align="center">
        <a href="https://inlang.com/documentation" target="_blank">Get Started</a> · 
        <a href="https://github.com/inlang/inlang/discussions" target="_blank">Discussions</a> · <a href="https://twitter.com/inlangHQ" target="_blank">Twitter</a>
    </h4>
</div>

# Inlang IDE Code Extension

This extension provides a seamless integration of the [Inlang](https://inlang.com) localization solution into Visual Studio Code. It allows you to translate your content directly in your IDE.

If something isn't working as expected or you have a feature suggestion, please join our [Discord](https://discord.gg/DEHKgmx2) or [create an issue](<[https](https://github.com/inlang/inlang/issues/new/choose)>). We are happy to help!

## Features

### ✂️ Extract Messages (translations)

Extract Messages (translations) via the `Inlang: Extract Message` code action.

<img width="500" src="https://cdn.jsdelivr.net/gh/inlang/inlang/assets/ide-extension/extract.gif"/>

### 🔎 Inline Annotations

See translations directly in your code. No more back-and-forth looking into the translation files themselves.

<img width="500" src="https://cdn.jsdelivr.net/gh/inlang/inlang/assets/ide-extension/inline.gif"/>

### 🔁 Update Translations

Translations from the resource files are automatically updated when you change the source text.

<img width="500" src="https://cdn.jsdelivr.net/gh/inlang/inlang/assets/ide-extension/update.gif"/>

## 1️⃣ Setup

Create a `inlang.config.js` in the **root** of your project. You can use the following template when using json files as translation files, if not, please look for other [supported resource file types](https://github.com/inlang/ecosystem#resources):

```js
export async function defineConfig(env) {
	const { default: jsonPlugin } = await env.$import(
		"https://cdn.jsdelivr.net/gh/samuelstroschein/inlang-plugin-json@latest/dist/index.js",
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

## 2️⃣ Usage

Just _highlight/select_ the text you want and hit `cmd .` or `ctrl +` (Quick Fix / Yellow Bulb) to open the **translate dialog** to provide a id for it.

If something isn't working as expected, please join our [Discord](https://discord.gg/DEHKgmx2) or [create an issue](<[https](https://github.com/inlang/inlang/issues/new/choose)>). We are happy to help!

## 3️⃣ Configuration

You can configure the extension to your needs by defining the `ideExtension` property in the config.

| Property                   | Type    | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| -------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `messageReferenceMatchers` | `Array` | An array of functions that define matchers for message references inside the code. Each function takes an argument of type `{ documentText: string }` and returns a promise that resolves to an array of message references (as defined by the `messageReferenceSchema`).                                                                                                                                                                                           |
| `extractMessageOptions`    | `Array` | An array of objects that define options for extracting messages. Each object has a property `callback` that is a function which is called when the user finishes the message extraction command. The `callback` function takes two arguments of type `string`: `messageId` (the message identifier entered by the user) and `selection` (the text which was extracted), and returns a `string` that represents the code which should be inserted into the document. |
| `documentSelectors`        | `Array` | An array of [VS Code DocumentSelectors](https://code.visualstudio.com/api/references/document-selector) that specify for which files/programming languages the extension should be activated. Each document selector is an object with optional properties `language`, `scheme`, `pattern`, and `notebookType`.                                                                                                                                                     |

For this example, the extension parses strings with a `t` translation function & gives the according extract options `{t("messageID")}` & `t("messageID")`.
You can fully customize this behavior with the example code below.

If you are using a different translation function, you can use the following code as a template:

```js
export async function defineConfig(env) {
	const { default: jsonPlugin } = await env.$import(
		"https://cdn.jsdelivr.net/gh/samuelstroschein/inlang-plugin-json@latest/dist/index.js",
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
