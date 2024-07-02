### Introduction

This plugin provides the integration for [SAP UI5](https://sdk.openui5.org/) into the Sherlock Visual Studio Code extension. It allows you to extract messages from your code, view them inline in the text editor, and get lints for your messages.

Match examples:
```ts
{i18n>message}
```
```ts
getResourceBundle().getText('message')
```
```ts
{{ message }}
```


### Usage

The plugin automatically extracts messages from your code and shows them inline in the editor. You can then click on the message to open the web editor and translate the message.

1. Install the [Visual Studio Code extension (Sherlock)](https://inlang.com/m/r7kp499g)
2. Storage plugin: Select a storage plugin, e.g. [JSON](https://inlang.com/m/ig84ng0o) or use the possibility of [writing your own plugin](https://inlang.com/documentation/plugin/guide).
3. Matcher plugin: Install this plugin (or copy the link below to your project settings)
4. ✨ See your messages appear inline in the editor

> There might be a delay before the messages appear in the editor. This is because the plugin needs to be downloaded first. If you want to ensure everything is setup correctly, reload your workspace.

### Manual installation

```diff
// project.inlang/settings.json
{
  "modules" : [
+    "https://cdn.jsdelivr.net/npm/@inlang/plugin-sap-ui5@latest/index.js"
  ]
}
```

---

_Is something unclear or do you have questions? Reach out to us in our [Discord channel](https://discord.gg/CNPfhWpcAa) or open a [Discussion](https://github.com/opral/monorepo/discussions) or an [Issue](https://github.com/opral/monorepo/issues) on [Github](https://github.com/opral/monorepo)._
