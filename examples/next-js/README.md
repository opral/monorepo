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

### 1. Install the SDK

```bash
npm i typesafe-i18n
```

### 2. Create the .typesafe-i18n.json config file

- `adapter` specifies that the generates i18n files should be react compatible.
- `outputPath` specifies that the files should be generated in the `i18n` folder.

```js title="/.typesafe-i18n.json"
{
  "$schema": "https://unpkg.com/typesafe-i18n@2.40.1/schema/typesafe-i18n.json",
  "adapter": "react",
  "outputPath": "./i18n/"
}
```

### 3. Adjust the build script

The SDK (typesafe-i18n & the inlang typesafe importer) run as background processes during development to constantly fetch updated translations from the dashboard. Since they should run simultaneously to the regular development process (`npm run dev`), we install 
helper package [npm-run-all](https://www.npmjs.com/package/npm-run-all). And adjust the dev script in the `package.json` to 
run the regular dev script, the SDK and the importer in parallel.

1. `npm install npm-run-all --save-dev`
2. Adjust the `dev` script in `package.json` to


and generate corresponding types.

