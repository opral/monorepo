[<img width="256px" height="auto" alt="Visual Studio Code install badge" src="https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/assets/marketplace/vscode-install-badge.svg" />](https://marketplace.visualstudio.com/items?itemName=inlang.vs-code-extension)

<doc-image src="https://cdn.jsdelivr.net/gh/opral/monorepo/inlang/source-code/ide-extension/assets/sherlock-cover-small.png" alt="Visual Studio Code extension (Sherlock) header image"></doc-image>

# 🕵️‍♂️ i18n inspector for VS Code

#### Used by developers from:
<doc-proof organisations="calcom, appflowy, openassistant, listmonk, jitsi"></doc-proof>

<br />

Inspect i18n within VS Code with powerful tools designed to streamline the translation process. Visualize, edit, and lint translated strings effortlessly using Inline Decorations & Hover Support. Extract new strings with a simple click, making localization tasks more intuitive and efficient.

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
  <doc-feature text-color="#000000" color="#F7FAFC" title="Monorepo support" image="https://cdn.jsdelivr.net/gh/opral/monorepo/inlang/source-code/ide-extension/assets/sherlock-monorepo.png"></doc-feature>
  <doc-feature text-color="#000000" color="#F7FAFC" title="Update Translations" image="https://cdn.jsdelivr.net/gh/opral/monorepo/inlang/source-code/ide-extension/assets/sherlock-update.png"></doc-feature>
  <doc-feature text-color="#000000" color="#F7FAFC" title="Transparent Errors" image="https://cdn.jsdelivr.net/gh/opral/monorepo/inlang/source-code/ide-extension/assets/sherlock-errors.png"></doc-feature>
</doc-features>

## Usage

Just _highlight/select_ the text you want and hit `cmd .` or `ctrl +` (Quick Fix / Yellow Bulb) to open the **translate dialog** to provide an id for it.

Hover over the message to see the tooltip with the translation.

If something isn't working as expected, please join our [Discord](https://discord.gg/CNPfhWpcAa) or [create an issue](https://github.com/opral/monorepo/issues/new/choose). We are happy to help!


# Let's get started

1. Add a `project.inlang` folder to your repository
2. Create a `settings.json` file to that new dir `project.inlang/settings.json`
3. Install a plugin that reads and writes your messages from the [inlang marketplace](https://inlang.com/c/plugins)
4. Install a syntax matcher/function matcher from the [inlang marketplace](https://inlang.com/c/plugins)
---
1. **Optional**: Install lint rules to find errors in your translations from the [inlang marketplace](https://inlang.com/c/lint-rules)

Look at the [example repository](https://github.com/opral/example) and it's [settings.json](https://github.com/opral/example/blob/main/project.inlang/settings.json) for a working example.




#### Requirements:

- VS Code version 1.84.0 or higher.
- Node.js version v18 or higher.

## Support: Join our Discord!

If something isn't working as expected or you have a feature suggestion, please join our [Discord](https://discord.gg/CNPfhWpcAa) or [create an issue](<[https](https://github.com/opral/monorepo/issues/new/choose)>). We are happy to help!

## Plugin authors

You can configure the extension to your needs by defining the `customApi` property in the `Plugin` interface.

| Property                   | Type    | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| -------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `messageReferenceMatchers` | `Array` | An array of functions that define matcher's for message references inside the code. Each function takes an argument of type `{ documentText: string }` and returns a promise that resolves to an array of message references (as defined by the `messageReferenceSchema`).                                                                                                                                                                                           |
| `extractMessageOptions`    | `Array` | An array of objects that define options for extracting messages. Each object has a property `callback` which is a function that is called when the user finishes the message extraction command. The `callback` function takes two arguments of type `string`: `messageId` (the message identifier entered by the user) and `selection` (the text which was extracted), and returns a `string` that represents the code which should be inserted into the document. |
| `documentSelectors`        | `Array` | An array of [VS Code DocumentSelectors](https://code.visualstudio.com/api/references/document-selector) that specify for which files/programming languages the extension should be activated. Each document selector is an object with optional properties `language`, `scheme`, `pattern`, and `notebookType`.                                                                                                                                                     |

For this example, the extension parses strings with a `t` translation function & gives the according extract options `{t("messageID")}` & `t("messageID")`.
You can fully customize this behavior.

## Pricing 

<doc-pricing heading="The core features are free for all users." content="While we may introduce enterprise features with associated costs due to API integrations, these enhancements are designed to meet the needs of larger companies. Our commitment remains to provide essential tools for developers, empowering them to address the challenges of international expansion for free."></doc-pricing>
