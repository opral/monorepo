# Using ParaglideJS with Next.js' App Router

In this guide you will lean how to add internationalised routing to your Next.js App that's using the App Router. We will use [ParaglideJS](https://inlang.com/m/gerre34r/library-inlang-paraglideJs) to manage our messages and the [ParaglideJS NextJS Adapter](https://inlang.com/m/osslbuzt/paraglide-next-i18n) for internationalised routing.

Paraglide is a great fit for the App router because it uses a compiler to generate tree-shakeable messages. That way your client bundle only includes the messages that are used in client components on any given page.

This guide assumes that you have a Next.js project set up, and you are using the app router. If you don't, you can follow the [official Next.js Getting Started Guide](https://nextjs.org/docs/getting-started/installation).

## Installing dependencies

The recommended way to install ParaglideJS is via the cli. This will create any files that are required for Paraglide.js to work and install the required dependencies.

In your project root, run the following commands and follow the instructions.

```bash
npx @inlang/paraglide-js init
npm install @inlang/paraglide-js-adapter-next
```

This will have done a few things:

- Created an inlang project in your project root
- Added the required devDependencies to your `package.json`
- Installed the ParaglideJS Adapter for Next


## Setting Up

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

Next, intialize the Adapter. Create a `src/lib/i18n.js` file and call the `createI18n` function. 

```js
// src/lib/i18n.js
import { createI18n } from "@inlang/paraglide-js-adapter-next"
// file may not exist until you've added a message & started the dev server
import type { AvailableLanguageTag } from "@/paraglide/runtime.js"

export const { middleware, Link, useRouter, usePathname, redirect, permanentRedirect } =
	createI18n<AvailableLanguageTag>()
```

Then register the middleware in `src/middleware.js`.

```js
export { middleware } from "@/lib/i18n"
```

Lastly, add the `<LanguageProvider>` to your `app/layout.tsx` file.

```tsx
import { LanguageProvider } from "@inlang/paraglide-js-adapter-next"
// file may not exist until you've added a message & started the dev server
import { languageTag } from "@/paraglide/runtime"

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<LanguageProvider>
			<html lang={languageTag()}>
				<body>
					{children}
				</body>
			</html>
		</LanguageProvider>
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

If you now run start your dev server you should see a new folder appear in your `src` folder called `paraglide`. This folder contains the compiled messages and any runtime code required by paraglide. Your messages live at `./src/paraglide/messages.js`, you will be importing from there.

Let's use the `hello_world` message on our homepage. Open `app/page.tsx`, import all messages from `paraglide/messages.js` and use the `hello_world` message in the `h1` tag.

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

> Note: If you are using Visual Studio Code, you should install [Sherlock (VS Code extension)](https://inlang.com/m/r7kp499g/app-inlang-ideExtension). It will give you inline previews of messages and allow you to edit them right in your source code.

## Adding more languages

You can add more languages to your project by adding them to the `languageTags` array in your Inlang project settings. Let's add german to our project.

```json
// project.inlang/settings.json
{
	"$schema": "https://inlang.com/schema/project-settings",
	"sourceLanguageTag": "en",
	"languageTags": ["en", "de"], // <-- Added german
	"...": "..."
}
```

Then add a messages file for the new language. 

```json
// messages/de.json
{
	"$schema": "https://inlang.com/schema/inlang-message-format",
	"hello_world": "Hallo Welt!"
}
```

If you now run the dev server, and visit `/en` and `/de`, you should see the Server Components switch languages. 

## Navigating

Because the App router (currently) doesn't offer i18n routing out of the box, you will need to use the custom Navigation Components & Hooks you exported from `src/lib/i18n.js`.

Replace the `<Link>` imports from `next/link` with the `Link` component from `@/lib/i18n`. 

```diff
- import Link from "next/link"
+ import { Link } from "@/lib/i18n"
```

And your imports from `next/navigation` with the ones from `@/lib/i18n`.

```diff
- import { usePathname, useRouter, redirect, permanentRedirect} from "next/navigation"
+ import { usePathname, useRouter, redirect, permanentRedirect} from "@/lib/i18n"
```

This can usually be done quite quickly with a find & replace.

The advantage of using the custom navigation components is that you don't need to manage the locale in your links. The `Link` component will automatically add the locale to the href.

```jsx
<Link href="/about" />

//will render as 
<a href="/about" />
<a href="/de/about" />
//depending on the current language
```

If you want to specify a language other than the current one you can use the `locale` prop.

```jsx
<Link href="/about" locale="de" />
```

All navigation hooks take & return paths without the locale prefix. 

```jsx
const pathname = usePathname() // will be `/about`, even if the current path is `/de/about`

// will redirect to `/about` or `/de/about` depending on the current language
redirect("/about")
permanentRedirect("/about")

// will navigate to `/about` or `/de/about` depending on the current language
const router = useRouter()
router.push("/about")
router.replace("/about")
```

## Building a Language Switcher

You can build a Language Switcher by linking to the current page with a different language. This can be done with an `<Link>` tag or with a programmatic navigation.

```jsx
import { Link, usePathname } from "@/lib/i18n"

export default function LanguageSwitcher() {
	const pathname = usePathname()
	return (
		<div>
			<Link href={pathname} locale="en">English</Link>
			<Link href={pathname} locale="de">Deutsch</Link>
		</div>
	)
}
```

## Next Steps

You should now have a fully functional multilingual NextJS app using ParaglideJS. Wasn't that hard was it?

You can check out the full source code of this example [here](https://github.com/opral/monorepo/tree/main/inlang/source-code/paraglide/paraglide-js-adapter-next/examples/app).

If you want to learn more about ParaglideJS, check out the [ParaglideJS Documentation](https://inlang.com/m/gerre34r/library-inlang-paraglideJs). If you need help or have some ideas, feel free to reach out to us on [Discord](https://discord.gg/CNPfhWpcAa) or open a Discussion on [GitHub](https://github.com/opral/monorepo/discussions).

