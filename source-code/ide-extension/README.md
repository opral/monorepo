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

If something isn't working as expected or you have a feature suggestion, please join our [Discord](https://discord.gg/DEHKgmx2) or [create an issue](<[https](https://github.com/inlang/inlang/issues/new/choose)>). We are happy to help! 🤗

## Features

### 🔎 Inline Annotations

See translations directly in your code. No more back-and-forth looking into the translation files themselves.

// TODO: Create new image

### ✂️ Extract Messages (translations)

Extract Messages (translations) via the `Inlang: Extract Message` code action.

// TODO: Create new image

## 1️⃣ Setup

Create a `inlang.config.js` in the **root** of your project. You can use the following template:

```js
export async function defineConfig(env) {
	const { default: ideExtensionPlugin } = await env.$import(
		"https://cdn.jsdelivr.net/npm/@inlang/ide-extension-plugin@latest/dist/index.js",
	)

	return {
		referenceLanguage: "en",
		plugins: [ideExtensionPlugin()],
	}
}
```

## 2️⃣ Usage

Just _highlight/select_ the text you want and hit `cmd .` or `ctrl +` (Quick Fix / Yellow Bulb) to open the **translate dialog** to provide a id for it.

If something isn't working as expected, please join our [Discord](https://discord.gg/DEHKgmx2) or [create an issue](<[https](https://github.com/inlang/inlang/issues/new/choose)>). We are happy to help!

## 3️⃣ Configuration

You can configure the extension to your needs, simply pass the following `ideExtensionPlugin({ /* configuration options */ })` below.
We also provide you whith an **code template** you can use to fully customize your behavior.

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
	const { default: ideExtensionPlugin } = await env.$import(
		"https://cdn.jsdelivr.net/npm/@inlang/ide-extension-plugin@latest/dist/index.js",
	)

	return {
		referenceLanguage: "en",
		plugins: [
			ideExtensionPlugin({
				messageReferenceMatchers: [
					//@ts-ignore
					async (/** @type {{ "documentText": string; }} */ args) => {
						const regex = /(?<!\w){?t\(['"](?<messageId>\S+)['"]\)}?/gm
						const str = args.documentText
						let match
						const result = []

						while ((match = regex.exec(str)) !== null) {
							const startLine =
								(str.slice(0, Math.max(0, match.index)).match(/\n/g) || []).length + 1
							const startPos = match.index - str.lastIndexOf("\n", match.index - 1)
							const endPos =
								match.index +
								match[0].length -
								str.lastIndexOf("\n", match.index + match[0].length - 1)
							const endLine =
								(str.slice(0, Math.max(0, match.index + match[0].length)).match(/\n/g) || [])
									.length + 1

							if (match.groups && "messageId" in match.groups) {
								result.push({
									messageId: match.groups["messageId"],
									position: {
										start: {
											line: startLine,
											character: startPos,
										},
										end: {
											line: endLine,
											character: endPos,
										},
									},
								})
							}
						}
						return result
					},
				],
				extractMessageOptions: [
					{
						callback: (messageId: string) => `{t("${messageId}")}`,
					},
					{
						callback: (messageId: string) => `t("${messageId}")`,
					},
				],
				documentSelectors: [
					{ language: "javascript" },
					{ language: "javascriptreact" },
					{ language: "typescript" },
					{ language: "typescriptreact" },
					{ language: "svelte" },
					{ language: "vue" },
					{ language: "html" },
				],
			}),
		],
	}
}
```
