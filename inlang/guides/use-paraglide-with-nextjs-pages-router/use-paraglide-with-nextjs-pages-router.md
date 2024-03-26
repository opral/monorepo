# Using ParaglideJS with Next.js' Pages Router

In this guide you will learn how to internationalise your NextJS app that's using the Pages router with ParaglideJS!

By the end you will have i18n routing set up in an SEO friendly manner, be able to use translations in your code, all using ParaglideJS which ships some very compact JS thanks to it's compiler based approach.

This guide assumes that you already have a Next.js project set up with the pages router. If you don't, you can follow the [official Next.js Getting Started Guide](https://nextjs.org/docs/getting-started/installation).

## Install ParaglideJS

We will need to install two things. ParaglideJS itself, and the ParaglideJS Adapter for NextJS.

ParaglideJS is the i18n library we will use for string translations. The Adapter makes it easier to integrate Paraglide with NextJS's i18n routing. 

In your project root, run the following commands and follow the instructions in your terminal.

```bash
npx @inlang/paraglide-js init
npm install @inlang/paraglide-js-adapter-next
```

This will have done a few things:

- Created an inlang project in your project root
- Added the required devDependencies to your `package.json`
- Added the paraglide compiler to your `package.json` build scripts
- Installed the ParaglideJS Adapter for Next. This will handle setting the Locale automatically

## Setting up 

In your `next.config.js`, import the Paraglide Plugin and apply it to your config.

You will need to pass it some config. The location of the Inlang Project & the output directory that messages should be compiled to. You should stick with the defaults unless you have a reason not to.

```js
// next.config.js
const { paraglide } = require("@inlang/paraglide-js-adapter-next/plugin")

module.exports = paraglide({
  paraglide: {
	project: "./project.inlang",
	outdir: "./src/paraglide"
  }
})
```

This Plugin will make sure to automatically recompile messages whenever they change.

Next, let's set up NextJS' built in i18n routing. 

Still in your `next.config.js`, add the `i18n` object to your config, pass it the languages you want to support and set the default language.

```js
// next.config.js
const { paraglide } = require("@inlang/paraglide-js-adapter-next/plugin")

module.exports = paraglide({
	paraglide: {
		project: "./project.inlang",
		outdir: "./src/paraglide"
	},
	i18n: {
		locales: ["en", "de"], //list the languages you intend to support
		defaultLocale: "en",
	},
})
```

Last, let's add the `<ParaglideJS>` component to your `_app.js` file. This will manage the language state for you.

```jsx
// _app.js
import type { AppProps } from "next/app"
import { ParaglideJS } from "@inlang/paraglide-js-adapter-next/pages"

export default function App({ Component, pageProps }: AppProps) {
	return (
		<ParaglideJS>
			<Component {...pageProps} />
		</ParaglideJS>
	)
}
```

## Our first Message

Let's create a `messages` folder in our project root. This is where we will store our messages. Then add an `en.json` file to it. 

```json
// messages/en.json
{
	"$schema": "https://inlang.com/schema/inlang-message-format",
	"hello_world": "Hello World!"
}
```

If you now start your app, you should see a new folder appear in your `src` folder called `paraglide`. This folder contains the compiled messages and any runtime code required by paraglide. Your messages live at `./src/paraglide/messages.js`.

Let's use the `hello_world` message on our homepage. Open `pages/index.js`, import from `paraglide/messages.js` and use the `hello_world` message in the `h1` tag.

```jsx
// @ is next's default alias for the src/ folder
// By convention paraglide uses import * as m
import * as m from "@/paraglide/messages" 

export default function Home() {
	return (
		<div>
			<h1>{m.hello_world()}</h1>
		</div>
	)
}
```

You should now see the message "Hello World!" on your homepage!

> Note: If you are using Visual Studio Code, you should install the accompanying [IDE Extension](https://inlang.com/m/r7kp499g/app-inlang-ideExtension). It will give you inline message previews & allow you to edit them right from your code.

## Adding more languages

You need to add more languages in two places. First, in your `next.config.js` file, and then in your Inlang project settings.

Let's add german to both:

```js
//next.config.js
module.exports = paraglide({
	i18n: {
		locales: ["en", "de"], // <-- Added german
		defaultLocale: "en",
	},
	...
})
```

```json
// project.inlang/settings.json
{
	"$schema": "https://inlang.com/schema/project-settings",
	"sourceLanguageTag": "en",
	"languageTags": ["en", "de"], // <-- Added german
	"...": "..."
}
```

You can now add a `de.json` file to your `messages` folder and add a german translation for the `hello_world` message.

```json
// messages/de.json
{
	"$schema": "https://inlang.com/schema/inlang-message-format",
	"hello_world": "Hallo Welt!"
}
```

With this config in place, you should get the following routing behaviour:

- `/some-page` - Default language (English)
- `/en/some-page` - English
- `/de/some-page` - German

When you visit `/de` you should now see the german translation of "Hello World!".

### Switching languages the right way

We will use a `<Link>` to switch languages. This will automatically rerender the page and load the correct messages. You can specify the `locale` prop to set which language to switch to.

```jsx
// pages/index.js
import * as m from "@/paraglide/messages"
import Link from "next/link"
import { useRouter } from "next/router"

export default function Home() {
	const router = useRouter()

	return (
		<div>
			<h1>{m.hello_world()}</h1>
			<Link href={router.asPath} locale="en" hrefLang="en">
				English
			</Link>
			<Link href={router.asPath} locale="de" hrefLang="de">
				German
			</Link>
		</div>
	)
}
```

Alternatively, you could use Next's `router.push` function to switch languages programmatically.

```jsx
// pages/index.js

import * as m from "@/paraglide/messages"
import { useRouter } from "next/router"

export default function Home() {
	const router = useRouter()

	return (
		<div>
			<h1>{m.hello_world()}</h1>
			<button onClick={() => router.push(router.asPath, router.asPath, { locale: "en" })}>
				English
			</button>
			<button onClick={() => router.push(router.asPath, router.asPath, { locale: "de" })}>
				German
			</button>
		</div>
	)
}
```

You should _always_ switch languages by doing a navigation. This will ensure that the correct messages are loaded and that the correct language is set in the url.

## Next Steps

That's it! You should now have a fully functional multilingual NextJS app using ParaglideJS. Wasn't that hard was it?

You can check out the full source code of this example [here](https://github.com/opral/monorepo/tree/main/inlang/source-code/paraglide/paraglide-js-adapter-next/examples/pages).

If you want to learn more about ParaglideJS, check out the [ParaglideJS Documentation](https://inlang.com/m/gerre34r/library-inlang-paraglideJs). If you need help or have some ideas, feel free to reach out to us on [Discord](https://discord.gg/CNPfhWpcAa) or open a Discussion on [GitHub](https://github.com/opral/monorepo/discussions).