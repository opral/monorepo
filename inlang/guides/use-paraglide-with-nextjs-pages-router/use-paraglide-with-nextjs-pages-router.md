# Using ParaglideJS with Next.js' Pages Router

In this guide we will use [Paraglide.js](https://inlang.com/m/gerre34r/library-inlang-paraglideJs), [inlang-message-format](https://inlang.com/m/reootnfj/plugin-inlang-messageFormat) and [inlang's IDE Extension](https://inlang.com/m/r7kp499g/app-inlang-ideExtension).

Translated string(s) in this guide might be referred to as message(s) or translation(s).

## 1. Starting point

This guide assumes that you have a Next.js project set up, and you are using the pages router. If you don't, you can follow the [official Next.js guide](https://nextjs.org/docs/getting-started/installation) to get started.

## 2. Install ParaglideJS

The recommended way to install ParaglideJS is via the cli. This will create any files that are required for Paraglide.js to work and install the required dependencies.

In your project root, run the following commands and follow the instructions.

```bash
npx @inlang/paraglide-js init
npm install
```

This will have done a few things:

- Created an inlang project in your project root
- Added the required devDependencies to your `package.json`
- Added the paraglide compiler to your `package.json` build scripts


It's recommended to also modify your `dev` command to include the `paraglide compile` command. This will cause the compiler to re-run whenever your messages change.

```json
// package.json
{
	"scripts": {
		"dev": "next dev & paraglide compile --project ./project.inlang --watch"
	}
}
```

## 3. Our first Messages

By default Paraglide uses [inlang-message-format](https://inlang.com/m/reootnfj/plugin-inlang-messageFormat) plugin to load messages. If you look in your Inlang project settings, you will see the `pathPattern` option specifiing _where_ translation files should be stored.

```json
// project.inlang/settings.json
{
    "$schema": "https://inlang.com/schema/project-settings",
	"sourceLanguageTag": "en",
	"languageTags": ["en"],
	"modules": [
		...
	],
	"plugin.inlang.messageFormat": {
		"pathPattern": "./messages/{languageTag}.json" // <-- This is the default
	}
}
```

Let's create a `messages` folder in our project root, and add a `en.json` file to it. This is where we will store our english messages.

```json
{
	"$schema": "https://inlang.com/schema/inlang-message-format",
	"hello_world": "Hello World!"
}
```

If you now run the Paraglide Compiler you should see a new folder appear in your `src` folder called `paraglide`. This folder contains the compiled messages and any runtime code required by paraglide. You shouldn't edit any files in there yourself, but it's a nice reference if you want to see what Paraglide is doing.

Your messages live at `./src/paraglide/messages.js`, you will be importing from there.

Let's use the `hello_world` message on our homepage. Open `pages/index.js`, import all messages from `paraglide/messages.js` and use the `hello_world` message in the `h1` tag.

```jsx
import * as m from "@/paraglide/messages" //use nextjs's default alias for src folder

export default function Home() {
	return (
		<div>
			<h1>{m.hello_world()}</h1>
		</div>
	)
}
```

You should now see the message "Hello World!" on your homepage!

> Note: If you are using VSCode, you should install the [inlang IDE Extension](https://inlang.com/m/r7kp499g/app-inlang-ideExtension). It will give you previews of your messages inline with your code, allow you to edit them without jumping between files and much more.

## 4. Using multiple languages

You can add more languages to your project by adding them to the `languageTags` array in your project settings. Let's add german to our project.

```json
{
	"$schema": "https://inlang.com/schema/project-settings",
	"sourceLanguageTag": "en",
	"languageTags": ["en", "de"], // <-- Added german
	"...": "..."
}
```

```json
// messages/de.json
{
	"$schema": "https://inlang.com/schema/inlang-message-format",
	"hello_world": "Hallo Welt!"
}
```

Let's add a button to our homepage that will change the language to german when clicked. We will use the `setLanguageTag` function from `paraglide/messages.js` to do this.

The way paraglide works is that you set the language by calling the `setLanguageTag`. This will change the language of any messages that are rendered going forward.
It will **not** change the language of messages that have already been loaded.
If you want to already rendere messages to change, you will need to force a rerender of the component. Once you have i18n routing set up this will happen automatically, but for now we will use a dummy state to force a rerender.

```jsx
import * as m from "@/paraglide/messages"
import { setLanguageTag } from "@/paraglide/runtime"

export default function Home() {
	//some dummy state to force a rerender when the language changes
	//We won't need this later
	const [dummyState, setDummyState] = useState(false)

	return (
		<div>
			<h1>{m.hello_world()}</h1>
			<button
				onClick={() => {
					setLanguageTag("de")
					setDummyState(!dummyState)
				}}
			>
				Deutsch
			</button>
		</div>
	)
}
```

## 5. Using i18n routing

The Pages Router comes with i18n routing support out of the box. To enable it, you need to add the `i18n` object to your `next.config.js` file.
Since it uses the same `languageTags` as paraglide, you can use the paraglide project settings to generate the `i18n` object.

```js
// next.config.js
import { availableLanguageTags, sourceLanguageTag } from "./src/paraglide/runtime.js"

export default {
	i18n: {
		//Use spread operator to shut typescript up
		locales: [...availableLanguageTags],
		defaultLocale: sourceLanguageTag,
	},
}
```

With this config in place, you should get the following routing behaviour:

- `/some-page` - Default language (English)
- `/en/some-page` - English
- `/de/some-page` - German

All we need to do is to set the [language tag](/m/8y8sxj09/library-inlang-languageTag) using the locale determined by next.js. We can do this by adding the following code to our `_app.js` file.

```tsx
import { AvailableLanguageTag, setLanguageTag } from "@/paraglide/runtime"
import type { AppProps } from "next/app"

export default function App({ Component, pageProps, router }: AppProps) {
	//Set the language tag to the locale determined by next.js
	setLanguageTag(router.locale as AvailableLanguageTag)

	return (
		<>
			<Component {...pageProps} />
		</>
	)
}
```

When you visit `/de` you should now see the german translation of "Hello World!". (You might need to restart your dev-server for the changes to take effect).

### Switching languages the right way

You can now remove the dummy state from the button in `pages/index.js`. Instead we will use a `<Link>` to switch languages. This will automatically rerender the page and load the correct messages.

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

## 6. Taking care of SEO

NextJS has some sensible default behaviour built in for multilingual SEO. For example it will automatically set the `lang` attribute on the `html` tag to the correct language.

The only thing we need to do is to add the alternat language links to the `head` of our page. That way search engines will know which pages are available in which languages.

Let's define an `I18NHeader` component that will add the correct `link` tags to the `head` of our page.

```jsx
// src/lib/I18NHeader.js
import { availableLanguageTags, sourceLanguageTag } from "@/paraglide/runtime"
import Head from "next/head"
import { useRouter } from "next/router"

export function I18NHeader() {
	const { asPath } = useRouter()

	function getCurrentPathInLanguage(languageTag: string) {
		if (languageTag === sourceLanguageTag) return asPath
		return `/${languageTag}${asPath}`
	}

	return (
		<Head>
			{availableLanguageTags.map((lang) => (
				<link rel="alternate" hrefLang={lang} href={getCurrentPathInLanguage(lang)} key={lang} />
			))}
		</Head>
	)
}
```

We can now use this component in our `_app.js` file to add the correct `link` tags to the `head` of our page.

```jsx
// src/pages/_app.js
import { I18NHeader } from "@/lib/I18NHeader"
import { AvailableLanguageTag, setLanguageTag } from "@/paraglide/runtime"
import type { AppProps } from "next/app"

export default function App({ Component, pageProps, router }: AppProps) {
	setLanguageTag(router.locale as AvailableLanguageTag)
	return (
		<>
			<I18NHeader />
			<Component {...pageProps} />
		</>
	)
}
```

If you now inspect the `head` of your page, you should see the correct `link` tags for each language.

## 7. Next Steps

That's it! You should now have a fully functional multilingual NextJS app using ParaglideJS. Wasn't that hard was it?

You can check out the full source code of this example [here](https://github.com/inlang/monorepo/tree/main/inlang/source-code/paraglide/paraglide-js-adapter-next/example-pages).

If you want to learn more about ParaglideJS, check out the [ParaglideJS Documentation](https://inlang.com/m/gerre34r/library-inlang-paraglideJs). If you need help or have some ideas, feel free to reach out to us on [Discord](https://discord.gg/gdMPPWy57R) or open a Discussion on [GitHub](https://github.com/inlang/monorepo/discussions).

Happy Coding!
