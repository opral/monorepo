import I18nRoutingDefinition from "../../docs-website/docs/definitions/i18n-routing.md";
import App from '!raw-loader!./pages/\_app.tsx';
import NextJSConfig from '!raw-loader!./next.config.js';
import CodeBlock from '@theme/CodeBlock';

> @GitHub reader: rendered version version is [here](https://docs.inlang.dev/getting-started/next-js)  
> @inlang reader: source code can be found [here](https://github.com/inlang/inlang/tree/main/examples/next-js)

# Quickstart

1. Clone the [inlang repository](https://github.com/inlang/inlang) by running

```bash
git clone https://github.com/inlang/inlang.git
```

2. Open `inlang/examples/next-js` in VSCode

3. Install the [inlang VSCode extension](https://marketplace.visualstudio.com/items?itemName=inlang.vscode-extension)

4. Run

```bash
1. npm install
2. npm run dev
```

The site should now be running on [http://localhost:3000](http://localhost:3000).

# Add inlang to an existing project

The following is a step by step guide to add inlang to an existing project.

## 1. Setup i18n routing

<details>
  <summary>What is i18n routing?</summary>
  <I18nRoutingDefinition />
</details>

NextJS supports i18n routing out of the box. Add the following to the `next.config.js`:

<CodeBlock title="/next.config.js" className="language-js">
{NextJSConfig}
</CodeBlock>

## 2. Configure Typesafe-i18n

> Read more about the SDK [here](/overview/sdk)

### 2.1. Install typesafe-i18n, the importer and concurrently

> Concurrently allows us to run the dev script, typesafe-i18n and importer in parallel.

```bash
npm i typesafe-i18n && npm i @inlang/typesafe-i18n-importer && npm i concurrently --save-dev
```

### 2.2. Create the .typesafe-i18n.json config file

- `adapter` specifies that the generates i18n files should be react compatible.
- `outputPath` specifies that the files should be generated in the `i18n` folder.

```js title="typesafe-i18n.json"
{
  "$schema": "https://unpkg.com/typesafe-i18n@2.40.1/schema/typesafe-i18n.json",
  "adapter": "react",
  "outputPath": "./i18n/"
}
```

### 2.3. Create the `inlang.config.json` file.

- `projectId`: create a project at [inlang](https://app.inlang.dev) and copy the project id
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

### 2.4. Adjust the build script

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

## 3. Let the magic begin

### 3.1. Start the development process

`npm run dev`

Typesafe-i18n should have created the `i18n` folder in the directory and will continously listen for changes from the dashboard.

### 3.2. Wrap the app with the `TypesafeI18n` component

```jsx title="pages/_app.tsx"
import TypesafeI18n from "../i18n/i18n-react";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <TypesafeI18n>
      <Component {...pageProps} />
    </TypesafeI18n>
  );
}
```

## BONUS: Add language detection

This example uses a very simple language selector mechanism. For more information about
selecting a language with Next.js i18n routing click [here](https://nextjs.org/docs/advanced-features/i18n-routing).

<details>
  <summary>Examplary language detection machanism</summary>
  <CodeBlock className="language-jsx" title="/pages/_app.tsx">{App}</CodeBlock>
</details>
