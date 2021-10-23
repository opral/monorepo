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

## 2. Add a language picker

This example uses a very simple language selector. For more information about
selecting a language with Next.js i18n routing click [here](https://nextjs.org/docs/advanced-features/i18n-routing).

The language selectors purpose is to route do a different language path in the url e.g. if the user selects
"de", the app should route to "http://localhost:3000/de/example". 

<details>
  <summary>Language selector</summary>
  <CodeBlock className="language-jsx" title="/components/LanguageSelector.tsx">{LanguageSelector}</CodeBlock>
</details>
