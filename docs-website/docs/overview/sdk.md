---
sidebar_position: 3
title: SDK
---

# [typesafe-i18n](https://github.com/ivanhofer/typesafe-i18n#readme)
We use typesafe-i18n for a type-safe i18n implementation. When using inlang you will in most cases only be exposed to a few methods from the typesafe-i18n library, as most of it is handled by our [typesafe-i18n-importer](#installation) and our [VSCode extension](#visual-studio-code-extension).
# Installation
## 1.1. Install typesafe-i18n, the importer and concurrently

```bash
npm i typesafe-i18n && npm i @inlang/typesafe-i18n-importer && npm i concurrently --save-dev
```

The SDK (typesafe-i18n & the inlang typesafe importer) run as background processes during development to constantly fetch updated translations from the dashboard and generate corresponding types. Since the processes should run simultaneously next to the regular development process (`npm run dev`), we adjust the dev script in the `package.json` to run the regular dev script, the SDK and the importer in parallel with the help of [concurrently](https://www.npmjs.com/package/concurrently).



## 1.2. Create the .typesafe-i18n.json config file

- `adapter` speficies which framework the i18n files should be compatible with.

```js title="typesafe-i18n.json"
{
  "$schema": "https://unpkg.com/typesafe-i18n@2.40.1/schema/typesafe-i18n.json",
  "adapter": "your framework"
}
```

| Framework  | Adapter |
|------------|--------------------------------------|
| React / Next.js | `"react"`  |
| Svelte / Svelte Kit | `"svelte"`  |
| Node | `"node"` |
| Angular | `"angular"` |

## 1.3. Create the `inlang.config.json` file.

- `projectId`: create a project at [inlang](https://app.inlang.dev) and copy the project id
- `wrappingPattern`: defines how a key (keyname) should be wrapped when creating a key with the [inlang
  VSCode extension](#visual-studio-code-extension). 
  



```js title="inlang.project.json for Next.js"
{
  "projectId": "YOUR PROJECT ID",
  "vsCodeExtension": {
    "wrappingPattern": "LL.keyname()"
  }
}
```

> Example wrawpping patterns for different frameworks

| Framework  | wrappingPattern                      |
|------------|--------------------------------------|
| Next.js    | `"wrappingPattern": "LL.keyname()"`  |
| React      | `"wrappingPattern": "LL.keyname()"`  |
| Svelte Kit | `"wrappingPattern": "$LL.keyname()"` |

## 1.4. Adjust the build script

Adjust the `dev` script in `package.json` to:

```json
 "scripts": {
   "dev": "npx concurrently --kill-others 'svelte-kit dev' 'npx typesafe-i18n' 'npx @inlang/typesafe-i18n-importer'",

   ... other scripts
 },
```

> The `--kill-others` flag ensures that if one script is failing all scripts fail. Otherwise, one
> script might fail silently.

## 1.5 Get started with inlang and typesafe-i18n
> Find your favorite framework in the sidebar

# Usage
For a detailed documentation of the typesafe-i18n please visit [typesafe-i18n docs](https://github.com/ivanhofer/typesafe-i18n#readme)
> [Is something missing in our docs?](https://submission.bromb.co/inlang/docs/feedback)

## The [i18nObject](https://github.com/ivanhofer/typesafe-i18n#i18nObject) (LL)
The LL object is a typed object exported by the typesafe-i18n [generator](https://github.com/ivanhofer/typesafe-i18n#typesafety).

```js
{LL.random_prefix_welcome()}
```

We use the `LL` wrapper to get the translated value of the given keys. In the example above it would return the translated text value of the key `random_prefix_welcome`

# Visual Studio Code extension

If using Visual Studio Code, install our extension to generate keys for your project while never leaving the IDE.

The VSCode extension adds a "Create key" command to the context menu. The command automatically sends the selected text/string as base translation to the inlang dashboard together with the key name.

Find our extension on the marketplace as [inlang](https://marketplace.visualstudio.com/items?itemName=inlang.vscode-extension)


For full documentation of the extension see the [inlang vscode-extension docs](https://github.com/inlang/inlang/tree/main/packages/inlang-vscode-extension)
