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

Depending on which router you are using your setup will be different. Make sure to read the documentation for the corerct router. Mixing routers is currently not supported.

However, the first step is the same for both. Let's install the Paraglide Next Plugin. 

In your `next.config.js`, import the `paraglide` plugin from `@inlang/paraglide-js-adapter-next/plugin`, wrap your config object with it and add a `paraglide` key. 

```js
const { paraglide } = require("@inlang/paraglide-js-adapter-next/plugin")

/** @type {import('next').NextConfig} */
module.exports = paraglide({
    paraglide: {
        project: "./project.inlang",
        outdir: "./src/paraglide",
    },
})
```

If you are using a newer version of Next, you can also use an `import` instead of calling `require`. 

## With NextJS App Router

The App router is the new recommended router for NextJS. It is more flexible, but less opinionated than the Pages router, so it requires a bit more setup. We will need to do the following:

1. Register the Paraglide Plugin in `next.config.js`. This will run the paraglide compiler on message changes.
2. Initialise the Adapter
3. Register the Locale Middleware in `src/middleware.js`
4. Register the Paraglide Language Provider in `src/app/layout.jsx`
5. Incrementally switch to the localised Navigation APIs

To register the Paraglide Plugin 


Now when you start your NextJS app, you should see requests to `/en` be rewritten to your homepage, even if you didn't add a `[lang]` parameter to your routes. 

The available languages are automatically determined from your `project.inlang/settings.json` file.

Next, we need to register the Locale Middleware. Create a `src/middleware.js` file and add paraglide's middleware to it.

```js
// src/middleware.js
export { middleware } from "@inlang/paraglide-js-adapter-next"
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

### Navigation

We still need to localise the `<Link>`s, so that we link to pages in the correct language. 

NextJS doesn't offer this in the App-Router, so we will need to use our own `<Link>` component. 

The Adapter Provides one for you. It's a drop-in replacemenet for the one from `next/link`. It's probably easiest to do a "find-and-replace" across your code-base for the import. 

```diff
- import Link from "next/link"
+ import { Link } from  "@/lib/i18n"
```

You can now link to a page without needing to include the language. 

```jsx
<Link href="/about">

//renders as

<a href="/de/about">

//depending on the language
```

For programmatic Navigations using `useRouter`, `redirect` or `permanentRedirect` there are also localised options available:

```ts
import { useRouter, redirect, permanentRedirect } from "@/lib/i18n"
```

That's it! You're done!$

### Advanced Setup

#### Translated Metadata

Next offers two ways of defining Metadata on a page. `export const metadata` and `generateMetadata`. We need to use `generateMetadata`, since we need to return different metadata for different languages.

```ts
export async function generateMetadata() {
  return {
    title: m.home_metadata_title(),
    description: m.home_metadata_description()
  };  
}
```

> If you were to use `export const metadata` your metadata would always end up in the source language. 

### With NextJS Pages Router

The Pages router already comes with i18n support out of the box. You can read more about it in the[NextJS Pages router documentation](https://nextjs.org/docs/advanced-features/i18n-routing). Thanks to this, Paraglide doesn't need to provide it's own routing. All the Adapter does in the Pages router is react to the language change.

To set up i18n routing in NextJS add an `i18n` object to your `next.config.js` file. In it you should specify the locales you want to support and the default locale. Make sure these match the ones in your `project.inlang/settings.json` file.

```js
module.exports = {
    i18n: {
        locales: ["en", "de"],
        defaultLocale: "en",
    },
}
```

> If you are using ESM for your NextJS config, you can also import `availableLanguageTags` and `sourceLanguageTag` from `./src/paraglide/runtime.js` and use them instead of hardcoding the locales. Doing this requires `"type": "module"` in your `package.json` & is entirely optional.

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

## Roadmap to 1.0
- Translated Pathnames
- Support Static Export
- Simplify Setup