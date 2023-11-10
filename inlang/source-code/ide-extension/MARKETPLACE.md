![inlang VS Code extension header image](https://cdn.jsdelivr.net/gh/inlang/monorepo@latest/inlang/source-code/ide-extension/assets/vs-code-extension-header.jpg)

# Superchange your i18n dev workflow

#### Used by developers from:
<doc-proof organisations="calcom, appflowy, openassistant, listmonk, jitsi"></doc-proof>

<br />

This extension provides a seamless integration of the [Inlang](https://inlang.com) localization solution into Visual Studio Code. It allows you to translate your content directly in your IDE.

If something isn't working as expected or you have a feature suggestion, please join our [Discord](https://discord.gg/DEHKgmx2) or [create an issue](<[https](https://github.com/inlang/monorepo/issues/new/choose)>). We are happy to help!

# Features

<doc-features>
  <doc-feature color="#E2E8F0" title="Extract messages" icon="solar:scissors-linear"></doc-feature>
  <doc-feature color="#E2E8F0" title="Inline Annotations" icon="solar:magnifer-bug-outline"></doc-feature>
  <doc-feature color="#E2E8F0" title="Inline Annotations" icon="solar:chat-square-code-outline"></doc-feature>
</doc-features>

… and much more as seen below

## Context Tooltips

See translations and edit them directly in your code. No more back-and-forth looking into the translation files themselves.

<img width="500" src="https://cdn.jsdelivr.net/gh/inlang/monorepo/inlang/assets/ide-extension/tooltip.gif"/>

## Extract Messages (translations)

Extract Messages (translations) via the `Inlang: Extract Message` code action.

<img width="500" src="https://cdn.jsdelivr.net/gh/inlang/monorepo/inlang/assets/ide-extension/extract.gif"/>

## Message Linting

Get notified about missing translations and other issues directly in your IDE.

<img width="500" src="https://cdn.jsdelivr.net/gh/inlang/monorepo/inlang/assets/ide-extension/lint.gif"/>

## Inline Annotations

See translations directly in your code. No more back-and-forth looking into the translation files themselves.

<img width="500" src="https://cdn.jsdelivr.net/gh/inlang/monorepo/inlang/assets/ide-extension/inline.gif"/>

## Update Translations

Translations from the resource files are automatically updated when you change the source text.

<img width="500" src="https://cdn.jsdelivr.net/gh/inlang/monorepo/inlang/assets/ide-extension/update.gif"/>

# How to use

## Setup

Create a `project.inlang.json` in the **root** of your project. You can use the following template when using json files as translation files, if not, please look for other [supported resource file types](https://inlang.com/):

```json
{
	// official schema ensures that your project file is valid
	"$schema": "https://inlang.com/schema/project-settings",
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

## Usage

Just _highlight/select_ the text you want and hit `cmd .` or `ctrl +` (Quick Fix / Yellow Bulb) to open the **translate dialog** to provide a id for it.

Hover over the message to see the tooltip with the translation.

If something isn't working as expected, please join our [Discord](https://discord.gg/gdMPPWy57R) or [create an issue](https://github.com/inlang/monorepo/issues/new/choose). We are happy to help!

## Configuration

You can configure the extension to your needs by defining the `ideExtension` property in the config.

| Property                   | Type    | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| -------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `messageReferenceMatchers` | `Array` | An array of functions that define matchers for message references inside the code. Each function takes an argument of type `{ documentText: string }` and returns a promise that resolves to an array of message references (as defined by the `messageReferenceSchema`).                                                                                                                                                                                           |
| `extractMessageOptions`    | `Array` | An array of objects that define options for extracting messages. Each object has a property `callback` that is a function which is called when the user finishes the message extraction command. The `callback` function takes two arguments of type `string`: `messageId` (the message identifier entered by the user) and `selection` (the text which was extracted), and returns a `string` that represents the code which should be inserted into the document. |
| `documentSelectors`        | `Array` | An array of [VS Code DocumentSelectors](https://code.visualstudio.com/api/references/document-selector) that specify for which files/programming languages the extension should be activated. Each document selector is an object with optional properties `language`, `scheme`, `pattern`, and `notebookType`.                                                                                                                                                     |

For this example, the extension parses strings with a `t` translation function & gives the according extract options `{t("messageID")}` & `t("messageID")`.
You can fully customize this behavior.