# ParaglideJS Adapter Next

This package provides an easy to use integration for using ParaglideJS in NextJS projects.

## Installation

First, install Paraglide as you would normally do:

```bash
npx @inlang/paraglide-js@latest init
```

You can read more about the basic ParaglideJS setup [here](https://inlang.com/m/gerre34r/library-inlang-paraglideJs).

Then, install the NextJS adapter package:

```bash
npm install @inlang/paraglide-js-adapter-next
```

## Setup

Depending on which router you are using your setup will be different. Make sure to read the documentation for your router. Mixing routers is currently not supported.

### With NextJS Pages Router

The Pages router already comes with i18n support out of the box. You can read more about it [here](https://nextjs.org/docs/advanced-features/i18n-routing). Thanks to this, Paraglide doesn't need to provide it's own routing, all it needs to do is react to the language state.

To set up basic i18n routing in NextJS add an `i18n` object to your `next.config.js` file. In it you should specify the locales you want to support and the default locale. Make sure these match the ones in your `project.inlang/settings.json` file.

```js
module.exports = {
    i18n: {
        locales: ["en", "de"],
        defaultLocale: "en",
    },
}
```

> If you are using ESM for your NextJS config, you can also import `availableLanguageTags` and `sourceLanguageTag` from `./src/paraglide/runtime.js` and use them instead of hardcoding the locales.

This will have the effect that NextJS will automatically prefix all routes with the locale. For example, the route `/about` will become `/en/about` for the English locale and `/de/about` for the German locale. The only language that won't be prefixed is the default locale.

Now all that's left is to tell paraglide which language to use. To do that, wrap your `_app.js` file with the `ParaglideJS` component, pass it the current language and the paraglide runtime module.

```jsx
import { ParaglideJS } from "@inlang/paraglide-js-adapter-next/pages"
import * as runtime from "@/paraglide/runtime.js"

export default function App({ Component, pageProps, router }: AppProps) {
	return (
		<ParaglideJS runtime={runtime} language={router.locale}>
			<Component {...pageProps} />
		</ParaglideJS>
	)
}
```

That's it! You can now use Paraglide's messages in your components.

```ts
import * as m from "@/paraglide/messages.js"

export default function Home() {
    return (
        <div>
            <h1>{m.hello_world()}</h1>
        </div>
    )
}
```

Now we just need to set the `lang` attribute on the `html` element. Do that in `src/pages/_document.js` by accessing the `languageTag` and using it as the `lang` attribute.

```jsx
import { languageTag } from "@/paraglide/runtime"
import { Html, Head, Main, NextScript } from "next/document"

export default function Document() {
	return (
		<Html lang={languageTag()}>
            ...
        </Html>
    )
}
```

You're done!

## With NextJS App Router

The App router is the new recommended router for NextJS. It is more flexible, but less opinionated than the Pages router, so it requires a bit more setup. We will need to do the following:

1. Register the Paraglide Plugin in `next.config.js`. This will add the necessary rewrite rules to the NextJS router.
2. Register the Locale Middleware in `src/middleware.js`. This will set the language for each request.
3. Register the Paraglide Language Provider in `src/app/layout.jsx`

To register the Paraglide Plugin in `next.config.js`, import the `withParaglide` function from `@inlang/paraglide-js-adapter-next/plugin`, wrap your config object with it and add a `paraglide` key. 

```js
const { withParaglide } = require("@inlang/paraglide-js-adapter-next/plugin")

/** @type {import('next').NextConfig} */
module.exports = withParaglide({
    paraglide: {
        project: "./project.inlang",
        outdir: "./src/paraglide",
    },
})
```
Now when you start your NextJS app, you should see requests to `/en` be rewritten to your homepage, even if you didn't add a `[lang]` parameter to your routes. 

The available languages are automatically determined from your `project.inlang/settings.json` file.

Next, we need to register the Locale Middleware. Create a `src/middleware.js` file and add paraglide's middleware to it.

```js
import { paraglideMiddleware } from "@inlang/paraglide-js-adapter-next/middleware"

export const middleware = paraglideMiddleware
```

Finally, we need to register the Paraglide Language Provider in `src/app/layout.jsx`. This is where we will set the language for each request.

```jsx
import { LanguageProvider } from "@inlang/paraglide-js-adapter-next"
import { languageTag } from "@/paraglide/runtime"
import { LanguageSwitcher } from "@/lib/LanguageSwitcher"

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<LanguageProvider>
			<html lang={languageTag()}>
				<body>
					<LanguageSwitcher />
					{children}
				</body>
			</html>
		</LanguageProvider>
	)
}
```

You can now use Paraglide's messages in your components.
However, your Links won't link to the correct language yet. To fix this we provide a `Link` component that you can use instead of the one from `next/link`. It will automatically prefix the correct language to the `href` attribute. 

```diff
- import Link from "next/link"
+ import { Link } from "@inlang/paraglide-js-adapter-next/link"
```

Both Link components have the same API, so you can safely find & replace the imports.

That's it! You're done!