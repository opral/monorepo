<div>
    <p align="center">
        <img width="300" src="https://cdn.jsdelivr.net/gh/inlang/monorepo/inlang/assets/logo-white-background.png"/>
    </p>
    <h4 align="center">
        <a href="https://inlang.com/documentation" target="_blank">Get Started</a> ·
        <a href="https://github.com/inlang/monorepo/discussions" target="_blank">Discussions</a> · <a href="https://twitter.com/inlangHQ" target="_blank">Twitter</a>
    </h4>
</div>

# Inlang IDE Code Extension

This extension provides a seamless integration of the [Inlang](https://inlang.com) localization solution into Visual Studio Code. It allows you to translate your content directly in your IDE.

If something isn't working as expected or you have a feature suggestion, please join our [Discord](https://discord.gg/DEHKgmx2) or [create an issue](<[https](https://github.com/inlang/monorepo/issues/new/choose)>). We are happy to help!

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

## 1️⃣ Setup

Create a `project.inlang.json` in the **root** of your project. You can use the following template when using json files as translation files, if not, please look for other [supported resource file types](https://inlang.com/marketplace):

```json
{
	// official schema ensures that your project file is valid
	"$schema": "https://inlang.com/project-config-schema",
	// the "source" language tag that is used in your project
	"sourceLanguageTag": "en",
	// all the language tags you want to support in your project
	"languageTags": ["en", "de"],
	"modules": [],
	"settings": {}
}
```

#### Requirements:

- Requires VS Code version 1.80.1 or higher.
- Node.js version 16.17.1 or higher.

## 2️⃣ Usage

Just _highlight/select_ the text you want and hit `cmd .` or `ctrl +` (Quick Fix / Yellow Bulb) to open the **translate dialog** to provide a id for it.

Hover over the message to see the tooltip with the translation.

If something isn't working as expected, please join our [Discord](https://discord.gg/gdMPPWy57R) or [create an issue](https://github.com/inlang/monorepo/issues/new/choose). We are happy to help!

## 3️⃣ Configuration

You can configure the extension to your needs by defining the `ideExtension` property in the config.

| Property                   | Type    | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| -------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `messageReferenceMatchers` | `Array` | An array of functions that define matchers for message references inside the code. Each function takes an argument of type `{ documentText: string }` and returns a promise that resolves to an array of message references (as defined by the `messageReferenceSchema`).                                                                                                                                                                                           |
| `extractMessageOptions`    | `Array` | An array of objects that define options for extracting messages. Each object has a property `callback` that is a function which is called when the user finishes the message extraction command. The `callback` function takes two arguments of type `string`: `messageId` (the message identifier entered by the user) and `selection` (the text which was extracted), and returns a `string` that represents the code which should be inserted into the document. |
| `documentSelectors`        | `Array` | An array of [VS Code DocumentSelectors](https://code.visualstudio.com/api/references/document-selector) that specify for which files/programming languages the extension should be activated. Each document selector is an object with optional properties `language`, `scheme`, `pattern`, and `notebookType`.                                                                                                                                                     |

For this example, the extension parses strings with a `t` translation function & gives the according extract options `{t("messageID")}` & `t("messageID")`.
You can fully customize this behavior.