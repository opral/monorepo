<div>
    <p align="center">
        <img width="100" src="https://cdn.jsdelivr.net/gh/inlang/monorepo/inlang/source-code/ide-extension/assets/icon-vscode-marketplace.png"/>
    </p>
	<h1 align="center">inlang – Supercharge i18n in VS Code</h1>
	<p align="center">
		<br>
		<a href='https://inlang.com/c/apps' target="_blank">🕹️ Apps</a>
		·
		<a href='https://inlang.com/documentation' target="_blank">📄 Docs</a>
		·
		<a href='https://discord.gg/gdMPPWy57R' target="_blank">💙 Discord</a>
		·
		<a href='https://twitter.com/inlangHQ' target="_blank">🐦 Twitter</a>
		·
		<a href='https://github.com/orgs/inlang/projects/39' target="_blank">🗺️ Roadmap</a>
	</p>
</div>

> Supercharge i18n within VS Code with powerful tools designed to streamline the translation process. Visualize, edit, and lint translated strings effortlessly using Inline Decorations & Hover Support. Extract new strings with a simple click, making localization tasks more intuitive and efficient.

[Inlang](https://inlang.com) is a powerful [open-source](https://github.com/inlang/monorepo/tree/main/inlang/source-code/ide-extension) extension for [Visual Studio Code](https://code.visualstudio.com/)

## Geting started

### 1. Create a `project.inlang.json` in the **root** of your project

You can use the following template when using json files as translation files, if not, please look for other [supported resource file types](https://inlang.com/):

```json
{
	// official schema ensures that your project file is valid
	"$schema": "https://inlang.com/schema/project-settings",
	// the "source" language tag that is used in your project
	"sourceLanguageTag": "en",
	// all the language tags you want to support in your project
	"languageTags": ["en", "de"],
	"modules": [
		"https://cdn.jsdelivr.net/npm/@inlang/plugin-json@4/dist/index.js"
	], // or use another storage module: https://inlang.com/c/plugins (i18next, json, inlang message format)
	"settings": {}
}
```

### 2. Decide on a **syntax matcher**

You should continue with **installing a syntax matcher**. There are multiple syntax matcher available like:

- m function matcher: https://inlang.com/m/632iow21/plugin-inlang-mFunctionMatcher
- t function matcher: https://inlang.com/m/698iow33/plugin-inlang-tFunctionMatcher
- *if you are using the i18next module, everything is already built-in*

### 3. ✨ Recommended

If you want to add lint rules to your experience, you can add them from: https://inlang.com/c/lint-rules

#### Requirements:

- VS Code version 1.84.0 or higher.
- Node.js version v18 or higher.

## Features

### Context Tooltips

See translations and edit them directly in your code. No more back-and-forth looking into the translation files themselves.

<img width="500" src="https://cdn.jsdelivr.net/gh/inlang/monorepo/inlang/assets/ide-extension/tooltip.gif"/>

### ✂️ Extract Messages (translations)

Extract Messages (translations) via the `Inlang: Extract Message` code action.

<img width="500" src="https://cdn.jsdelivr.net/gh/inlang/monorepo/inlang/assets/ide-extension/extract.gif"/>

### Message Linting

Get notified about missing translations and other issues directly in your IDE.

<img width="500" src="https://cdn.jsdelivr.net/gh/inlang/monorepo/inlang/assets/ide-extension/lint.gif"/>

### 🔎 Inline Annotations

See translations directly in your code. No more back-and-forth looking into the translation files themselves.

<img width="500" src="https://cdn.jsdelivr.net/gh/inlang/monorepo/inlang/assets/ide-extension/inline.gif"/>

### 🔁 Update Translations

Translations from the resource files are automatically updated when you change the source text.

<img width="500" src="https://cdn.jsdelivr.net/gh/inlang/monorepo/inlang/assets/ide-extension/update.gif"/>

## Usage

Just _highlight/select_ the text you want and hit `cmd .` or `ctrl +` (Quick Fix / Yellow Bulb) to open the **translate dialog** to provide a id for it.

Hover over the message to see the tooltip with the translation.

If something isn't working as expected, please join our [Discord](https://discord.gg/gdMPPWy57R) or [create an issue](https://github.com/inlang/monorepo/issues/new/choose). We are happy to help!

## Support: Join our Discord!

If something isn't working as expected or you have a feature suggestion, please join our [Discord](https://discord.gg/DEHKgmx2) or [create an issue](<[https](https://github.com/inlang/monorepo/issues/new/choose)>). We are happy to help!
