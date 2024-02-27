# Paraglide Adapter Next

Everything you need to internationalize your NextJS app with [ParaglideJS](https://inlang.com/m/gerre34r/library-inlang-paraglideJs).

**Features**

- 🪂 Automatically set & manage the language for Paraglide
- 💨 A breeze to set up - No need to change your `app/` folder
- 📦 Built for RSC
- 🪄 Supports both App & Pages router
- 🤖 SEO friendly out of the box

## Installation & Setup

First, let's set up [ParaglideJS](https://inlang.com/m/gerre34r/library-inlang-paraglideJs) itself.

```bash
npx @inlang/paraglide-js@latest init
```

This will have created a `./project.inlang` folder containing a `settings.json` file. There you will configure which languages you want to support.

Add a `./messages` folder and add a json file for each of your languages:

```json
// messages/en.json
{
	"hello_world": "Hello World"
}
```

Your messages will live in these files. You can either add & edit them manually, or use the [IDE Extension](https://inlang.com/m/r7kp499g/app-inlang-ideExtension).

Then, install the Paraglide NextJS Adapter:

```bash
npm install @inlang/paraglide-js-adapter-next
```

Install the Paraglide Next Plugin in `next.config.js`.

```ts
const { paraglide } = require("@inlang/paraglide-js-adapter-next/plugin")

/** @type {import('next').NextConfig} */
module.exports = paraglide({
    paraglide: {
        // recommended setup
        project: "./project.inlang", / /the path to the Inlang project
        outdir: "./src/paraglide", // where you want the generated files to go
    },
})
```

> In newer versions of Next, the config may be using ESM. Use an import statement instead.

## App Router Setup

### 1. Initialise the Adapter

Create this file in `src/lib/i18n.ts`:

```ts
// src/lib/i18n.ts
import { createI18n } from "@inlang/paraglide-js-adapter-next"
import type { AvailableLanguageTag } from "@/paraglide/runtime.js"

// All available functions exported. Just use the ones you need
export const { middleware, Link, useRouter, usePathname, redirect, permanentRedirect } =
	createI18n<AvailableLanguageTag>()
```

<doc-accordion
	heading="Can I put this somewhere else?"
	text="Sure, you can put it anywhere. Just be aware that you will be importing from this file a lot, so make sure it's somewhere convenient">
</doc-accordion>

### 2. Add the Middleware

In `src/middleware.ts`:

```ts
export { middleware } from "@/lib/i18n.js"
```

### 3. Add the Language Provider

In `src/app/layout.tsx` add the `<LanguageProvider>` component & set the lang attribute on your html element:

```tsx
import { LanguageProvider } from "@inlang/paraglide-js-adapter-next"
import { languageTag } from "@/paraglide/runtime"

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<LanguageProvider>
			<html lang={languageTag()}>
				<body>{children}</body>
			</html>
		</LanguageProvider>
	)
}
```

### 4. Use the localised navigation APIs

In order to get localised `<Link>`s you need to replace the ones from `next/link` with the ones from `@/lib/i18n.js`.
You can easily find & replace the imports.

```diff
- import Link from "next/link"
+ import { Link } from "@/lib/i18n" 
```

The same goes for the other navigation APIs.

```diff
- import { usePathname, useRouter, redirect, permanentRedirect} from "next/navigation"
+ import { usePathname, useRouter, redirect, permanentRedirect} from "@/lib/i18n"
```

### 5. Have Fun!

You should now have working localised routing set up! Try visiting `/de` or whatever languages you have configured.

Using messages works by importing them from `@/paraglide/messages.js`.

```tsx
import * as m from "@/paraglide/messages.js"

export function Home() {
	return (
		<>
			<h1>{m.homepage_title()}</h1>
			<p>{m.homepage_subtitle({ some: "param" })}</p>
		</>
	)
}
```

Messages are fully typesafe. If you are using the [IDE Extension](https://inlang.com/m/r7kp499g/app-inlang-ideExtension) you will
get previews of the text-content right in your code!

Only the messages that are used in client components will be sent to the client. Messages used in Server Components don't
increase your bundle size. Isn't that neat?

### Usage

#### Translated Metadata

Next offers two ways of defining Metadata on a page. `export const metadata` and `generateMetadata`. We need to use `generateMetadata`, since we need to return different metadata for different languages.

```ts
export async function generateMetadata() {
	return {
		title: m.home_metadata_title(),
		description: m.home_metadata_description(),
	}
}
```

> If you were to use `export const metadata` your metadata would always end up in the source language.

#### Linking to Pages in other Languages

If you want a Link to be in a specific language you can use the `locale` prop.

```
<Link href="/about" locale="de">
```

This is convenient for constructing language switchers.

If you are using `router.push` to navigate you can pass `locale` as an option.

```ts
function Component() {
	const router = useRouter()
	return <button onClick={()=>router.push("/about", { locale: "de" })}>
        Go to German About page
    </button>
}
```

#### Excluding certain routes from i18n

You can exclude certain routes from i18n using the `exclude` option on `createI18n`. You can either pass a string or a regex.

```ts
export const { ... } =
	createI18n<AvailableLanguageTag>({
		 //array of routes to exclude
		exclude: [
			/^\/api(\/.*)?$/ //excludes all routes starting with /api
			"/admin" //excludes /admin, but not /admin/anything - globs are not supported
		],
	})
```

Excluded routes won't be prefixed with the language tag & the middleware will not add `Link` headers to them.

> Tip: LLMs are really good at writing regexes.

#### Changing the default language

Usually the default language is the `sourceLanguageTag` you defined in your `project.inlang/settings.json`. If you want to change it, you can use the `defaultLanguage` option on `createI18n`.


```ts
export const { ... } =
	createI18n<AvailableLanguageTag>({
		defaultLanguage: "de"
	})
```

This will change which langauge doesn't get a prefix in the URL.

#### Translated Pathnames
You can translate pathnames by adding a `pathname` option to `createI18n`. This allows you to define a different pathname for each language.

```ts
export const { ... } =
	createI18n<AvailableLanguageTag>({
		pathname: {
			"/about": {
				de: "/ueber-uns",
				en: "/about"
			}
		}
	})
```

An even better option is to use a message to manage the pathnames. This way you can change the pathnames without changing the code.

```json
// messages/en.json
{
	"about_pathname": "/about"
}
// messages/de.json
{
	"about_pathname": "/ueber-uns"
}
```

```ts
export const { ... } =
	createI18n<AvailableLanguageTag>({
		pathname: {
			"/about": m.about_pathname //pass as reference
		}
	})
```

## (legacy) Setup With the Pages Router

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

Now all that's left is to tell paraglide which language to use. To do that, wrap your `_app.js` file with the `ParaglideJS` component.

```jsx
import { ParaglideJS } from "@inlang/paraglide-js-adapter-next/pages"

export default function App({ Component, pageProps }: AppProps) {
	return (
		<ParaglideJS>
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

Now we just need to set the `lang` attribute on the `html` element. Do that in `src/pages/_document.js` using the `languageTag()`function.

```jsx
import { languageTag } from "@/paraglide/runtime"
import { Html, Head, Main, NextScript } from "next/document"

export default function Document() {
	return <Html lang={languageTag()}>...</Html>
}
```

## Roadmap to 1.0

- Translated Pathnames
- Better Static Export support
- Simplify Setup
- Expand Routing Strategies

## Examples

You can find example projects on our Github, or try them on StackBlitz:
- [App Router Example Repository](https://github.com/opral/monorepo/tree/main/inlang/source-code/paraglide/paraglide-js-adapter-next/examples/app)
- [App Router Example on StackBlitz](https://stackblitz.com/~/LorisSigrist/paraglide-next-app-router-example)
- [Pages Router Example](https://github.com/opral/monorepo/tree/main/inlang/source-code/paraglide/paraglide-js-adapter-next/examples/pages)
- [Pages Router Example on StackBlitz](https://stackblitz.com/~/LorisSigrist/paraglide-next-pages-router-example)