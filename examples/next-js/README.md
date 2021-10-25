import I18nRoutingDefinition from "../../docs-website/docs/definitions/i18n-routing.md";
import LanguageSelector from '!raw-loader!./components/LanguageSelector.tsx';
import NextJSConfig from '!raw-loader!./next.config.js';
import CodeBlock from '@theme/CodeBlock';

> @GitHub reader: rendered version version is [here](https://docs.inlang.dev/getting-started/next-js)  
> @inlang reader: source code can be found [here](https://github.com/inlang/inlang/tree/main/examples/next-js)

This example is a the default Next.js example created with the `create-next-app` [command](https://github.com/vercel/next.js/tree/canary/packages/create-next-app). The example can be started with the following commands:

```bash
1. npm install
2. npm run dev
```

The site should now be running on [http://localhost:3000](http://localhost:3000).

## 1. Setup i18n routing

<details>
  <summary>What is i18n routing?</summary>
  <I18nRoutingDefinition />
</details>

NextJS supports i18n routing out of the box. Add the following to the `next.config.js`:

<CodeBlock title="/next.config.js" className="language-js">
{NextJSConfig}
</CodeBlock>

## 2. Add a language selector

The language selectors purpose is to route do a different language path in the url e.g. if the user selects
"de", the app should route to "http://localhost:3000/de/example".

This example uses a very simple language selector. For more information about
selecting a language with Next.js i18n routing click [here](https://nextjs.org/docs/advanced-features/i18n-routing).

<details>
  <summary>Examplary language selector</summary>
  <CodeBlock className="language-jsx" title="/components/LanguageSelector.tsx">{LanguageSelector}</CodeBlock>
</details>

## 3. Configure the SDK

> Read more about the SDK [here](/overview/sdk)

### 1. Install the SDK, importer and concurrently

> Concurrently allows us to run the dev script, SDK and importer in parallel.

```bash
npm i typesafe-i18n && npm i @inlang/typesafe-i18n-importer && npm i concurrently --save-dev
```

### 2. Create the .typesafe-i18n.json config file

- `adapter` specifies that the generates i18n files should be react compatible.
- `outputPath` specifies that the files should be generated in the `i18n` folder.

```js title="typesafe-i18n.json"
{
  "$schema": "https://unpkg.com/typesafe-i18n@2.40.1/schema/typesafe-i18n.json",
  "adapter": "react",
  "outputPath": "./i18n/"
}
```

### 3. Create the `inlang.config.json` file.

- `wrappingPattern`: defines how a key (keyname) should be wrapped when creating a key with the [inlang
  VSCode extension](https://marketplace.visualstudio.com/items?itemName=inlang.vscode-extension). For React it's
  "LL.keyname()".

```js title="inlang.project.json"
{
  "projectId": "YOUR PROJECT ID",
  "vsCodeExtension": {
    "wrappingPattern": "LL.keyname()"
  }
}
```

### 4. Adjust the build script

The SDK (typesafe-i18n & the inlang typesafe importer) run as background processes during development to constantly fetch updated translations from the dashboard and generate corresponding types. Since the processes should run simultaneously next to the regular development process (`npm run dev`), we adjust the dev script in the `package.json` to run the regular dev script, the SDK and the importer in parallel with the help of [concurrently](https://www.npmjs.com/package/concurrently).

Adjust the `dev` script in `package.json` to:

```json
 "scripts": {
   "dev": "npx concurrently --kill-others 'next dev' 'npx typesafe-i18n' 'npx @inlang/typesafe-i18n-importer'",

   ... other scripts
 },
```

> The `--kill-others` flag ensures that if one script is failing all scripts fail. Otherwise, one
> script might fail silently.
