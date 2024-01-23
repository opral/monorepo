[<img width="256px" height="auto" alt="VSCode install badge" src="https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/assets/marketplace/vscode-install-badge.svg" />](https://marketplace.visualstudio.com/items?itemName=inlang.vs-code-extension)

<doc-image src="https://cdn.jsdelivr.net/gh/opral/monorepo/inlang/source-code/ide-extension/assets/ide-extension-cover-small.png" alt="inlang VS Code extension header image"></doc-image>

# Superchange your i18n dev workflow

#### Used by developers from:
<doc-proof organisations="calcom, appflowy, openassistant, listmonk, jitsi"></doc-proof>

<br />

Supercharge i18n within VS Code with powerful tools designed to streamline the translation process. Visualize, edit, and lint translated strings effortlessly using Inline Decorations & Hover Support. Extract new strings with a simple click, making localization tasks more intuitive and efficient.

[Inlang](https://inlang.com) is a powerful [open-source](https://github.com/opral/monorepo/tree/main/inlang/source-code/ide-extension) extension for [Visual Studio Code](https://code.visualstudio.com/)

## Manage Translations directly from your Code 

View translations within your code, extract new strings with a simple click, and effortlessly edit translated strings using Inline Decorations & Hover Support. Get notified of missing translations and other issues in real-time directly in your IDE.

<doc-features>
  <doc-feature text-color="#000000" color="#F7FAFC" title="Inline Annotaions" image="https://cdn.jsdelivr.net/gh/opral/monorepo/inlang/source-code/ide-extension/assets/ide-inline-small.png"></doc-feature>
  <doc-feature text-color="#000000" color="#F7FAFC" title="Lint messages" image="https://cdn.jsdelivr.net/gh/opral/monorepo/inlang/source-code/ide-extension/assets/ide-lint-small.png"></doc-feature>
  <doc-feature text-color="#000000" color="#F7FAFC" title="Extract Messages" image="https://cdn.jsdelivr.net/gh/opral/monorepo/inlang/source-code/ide-extension/assets/ide-extract-small.png"></doc-feature>
</doc-features>

## Inlang Tab - Transparent & Fast

You can have multiple projects in your repository. By using the inlang tab, it's easy to switch between projects. Whenever you change the source text, translations from the resource files will be automatically updated. Additionally, the tab menu provides a quick overview of any project errors in the setup.

<doc-features>
  <doc-feature text-color="#000000" color="#F7FAFC" title="Monorepo support" image="https://cdn.jsdelivr.net/gh/opral/monorepo/inlang/source-code/ide-extension/assets/ide-monorepo-small.png"></doc-feature>
  <doc-feature text-color="#000000" color="#F7FAFC" title="Update Translations" image="https://cdn.jsdelivr.net/gh/opral/monorepo/inlang/source-code/ide-extension/assets/ide-update-small.png"></doc-feature>
  <doc-feature text-color="#000000" color="#F7FAFC" title="Transparent Errors" image="https://cdn.jsdelivr.net/gh/opral/monorepo/inlang/source-code/ide-extension/assets/ide-errors-small.png"></doc-feature>
</doc-features>

## Usage

Just _highlight/select_ the text you want and hit `cmd .` or `ctrl +` (Quick Fix / Yellow Bulb) to open the **translate dialog** to provide a id for it.

Hover over the message to see the tooltip with the translation.

If something isn't working as expected, please join our [Discord](https://discord.gg/gdMPPWy57R) or [create an issue](https://github.com/opral/monorepo/issues/new/choose). We are happy to help!

## Configuration

You can configure the extension to your needs by defining the `ideExtension` property in the config.

| Property                   | Type    | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| -------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `messageReferenceMatchers` | `Array` | An array of functions that define matchers for message references inside the code. Each function takes an argument of type `{ documentText: string }` and returns a promise that resolves to an array of message references (as defined by the `messageReferenceSchema`).                                                                                                                                                                                           |
| `extractMessageOptions`    | `Array` | An array of objects that define options for extracting messages. Each object has a property `callback` that is a function which is called when the user finishes the message extraction command. The `callback` function takes two arguments of type `string`: `messageId` (the message identifier entered by the user) and `selection` (the text which was extracted), and returns a `string` that represents the code which should be inserted into the document. |
| `documentSelectors`        | `Array` | An array of [VS Code DocumentSelectors](https://code.visualstudio.com/api/references/document-selector) that specify for which files/programming languages the extension should be activated. Each document selector is an object with optional properties `language`, `scheme`, `pattern`, and `notebookType`.                                                                                                                                                     |

For this example, the extension parses strings with a `t` translation function & gives the according extract options `{t("messageID")}` & `t("messageID")`.
You can fully customize this behavior.

## Quick start

<doc-image src="https://cdn.jsdelivr.net/gh/opral/monorepo/inlang/source-code/ide-extension/assets/ide-start.png" alt="Get Started"></doc-image>

Just install the extension and click on `Getting Started` in the `Inlang Tab`. 

## Manual setup

### 1. Create a `project.inlang/settings.json` in the **root** of your project

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

## Support: Join our Discord!

If something isn't working as expected or you have a feature suggestion, please join our [Discord](https://discord.gg/DEHKgmx2) or [create an issue](<[https](https://github.com/opral/monorepo/issues/new/choose)>). We are happy to help!

## Pricing 

<doc-dev-tool-pricing></doc-dev-tool-pricing>