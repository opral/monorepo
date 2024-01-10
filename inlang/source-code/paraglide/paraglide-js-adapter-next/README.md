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

## With NextJS App Router

The App router is the new recommended router for NextJS. It is more flexible, but less opinionated than the Pages router, so it requires a bit more setup.

TODO