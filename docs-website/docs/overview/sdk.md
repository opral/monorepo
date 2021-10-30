---
sidebar_position: 3
title: SDK
---

# typesafe-i18n
An opinionated, fully type-safe, lightweight localization library for TypeScript and JavaScript projects with no external dependencies.

## Installation
### 1.1. Install typesafe-i18n, the importer and concurrently


```bash
npm i typesafe-i18n
npm i @inlang/typesafe-i18n-importer
npm i concurrently --save-dev
```

### 1.2. Create the .typesafe-i18n.json config file

- `adapter` specifies that the generates i18n files should be react compatible.

```js title="typesafe-i18n.json"
{
  "$schema": "https://unpkg.com/typesafe-i18n@2.40.1/schema/typesafe-i18n.json",
  "adapter": "svelte"
}
```

### 1.3. Create the `inlang.config.json` file.

- `projectId`: create a project at [inlang](https://app.inlang.dev) and copy the project id
- `wrappingPattern`: defines how a key (keyname) should be wrapped when creating a key with the [inlang
  VSCode extension](https://marketplace.visualstudio.com/items?itemName=inlang.vscode-extension). For Svelte Kit it's
  "$LL.keyname()".

```js title="inlang.project.json"
{
  "projectId": "YOUR PROJECT ID",
  "vsCodeExtension": {
    "wrappingPattern": "$LL.keyname()"
  }
}
```

### 1.4. Adjust the build script

The SDK (typesafe-i18n & the inlang typesafe importer) run as background processes during development to constantly fetch updated translations from the dashboard and generate corresponding types. Since the processes should run simultaneously next to the regular development process (`npm run dev`), we adjust the dev script in the `package.json` to run the regular dev script, the SDK and the importer in parallel with the help of [concurrently](https://www.npmjs.com/package/concurrently).

Adjust the `dev` script in `package.json` to:

```json
 "scripts": {
   "dev": "npx concurrently --kill-others 'svelte-kit dev' 'npx typesafe-i18n' 'npx @inlang/typesafe-i18n-importer'",

   ... other scripts
 },
```

> The `--kill-others` flag ensures that if one script is failing all scripts fail. Otherwise, one
> script might fail silently.

### 1.5 Get started with inlang and typesafe-i18n
Find your favorite framework in the sidebar

# Usage
For a detailed documentation of the typesafe-i18n please visit [typesafe-i18n doccs](https://github.com/ivanhofer/typesafe-i18n#readme)

## The [i18nObject](https://github.com/ivanhofer/typesafe-i18n#i18nObject) (LL)
The LL object is a typed object exported by the typesafe-i18n [generator](https://github.com/ivanhofer/typesafe-i18n#typesafety).

```js
{$LL.random_prefix_welcome()}
```

We use it to generate keys, for existing text or text to be added later. The keys are synchronized with the inlang database, and can be edited from the dashboard under your connected project.

Using our IDE extensions you can make the whole process of converting text to i18n keys eaiser. You can find the documentation for our extensions [here] (/overview/ide-integration)

# Visual Studio Code extension

If using Visual Studio Code, it is highly recommended to install the extension to allow for key generation while never leaving the file.

The VSCode extension adds a "Send to inlang" command to the context menu. The command automatically sends the selected text/string as base translation to the inlang dashboard together with the key.

Intall by running the following command or find us on the marketplace as [inlang](https://marketplace.visualstudio.com/items?itemName=inlang.vscode-extension)
```bash
ext install inlang.vscode-extension
```

For full documentation see the [inlang vscode-extension docs](https://github.com/inlang/inlang/tree/main/packages/inlang-vscode-extension)

> [Is something missing in our docs?](https://submission.bromb.co/inlang/docs/feedback)