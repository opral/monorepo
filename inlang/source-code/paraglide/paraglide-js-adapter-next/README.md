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

So let's set up basic i18n routing in NextJS. First, in your `next.config.js` file, add an `i18n` object:

```js
module.exports = {
    i18n: {
        locales: ["en", "de"],
        defaultLocale: "en",
    },
}
```


To do this, wrap your `_app.js` file with the `ParaglideJS` component for the Pages router:

```jsx
import { ParaglideJS } from "@inlang/paraglide-js-adapter-next"

export default function App({ Component, pageProps, router }: AppProps) {
	return (
		<ParaglideJS language={router.locale}>
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