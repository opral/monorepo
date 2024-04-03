![Dead Simple i18n. Typesafe, Small Footprint, SEO-Friendly and IDE Integration.](https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/source-code/paraglide/paraglide-js-adapter-next/assets/header.png)

<doc-features>
<doc-feature text-color="#0F172A" color="#E1EFF7" title="Internationalized Routing" image="https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/source-code/paraglide/paraglide-js-adapter-next/assets/i18n-routing.png"></doc-feature>
<doc-feature text-color="#0F172A" color="#E1EFF7" title="Tiny Bundle Size" image="https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/source-code/paraglide/paraglide-js-adapter-next/assets/bundle-size.png"></doc-feature>
<doc-feature text-color="#0F172A" color="#E1EFF7" title="No route Param needed" image="https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/source-code/paraglide/paraglide-js-adapter-next/assets/no-param.png"></doc-feature>
</doc-features>

## Getting Started

Install [ParaglideJS](https://inlang.com/m/gerre34r/library-inlang-paraglideJs) and the [Paraglide NextJS Adapter](https://inlang.com/m/osslbuzt/paraglide-next-i18n).

```bash
npx @inlang/paraglide-js@latest init
npm install @inlang/paraglide-js-adapter-next
```

### Step 0. Set up Paraglide

In the generated `./project.inlang/settings.json`, configure which languages you want to support.

```json
// project.inlang/settings.json
{
	"languageTags": ["en", "de"],
	"sourceLanguageTag": "en"
}
```

Create a `./messages` folder with a json file per language and add some messages

```json
// messages/en.json
{
	"hello": "Hello {name}"
}
```

### Step 1. Add the Next-Plugin

Add the Next-Plugin in `next.config.mjs`.

```ts
// make sure to import from /plugin
import { paraglide } from "@inlang/paraglide-js-adapter-next/plugin"

export default paraglide({
	paraglide: {
		//recommended setup
		project: "./project.inlang", //the path to the Inlang project
		outdir: "./src/paraglide", // where you want the generated files to go
	},

	// ... rest of your next config
})
```

### Step 2. Initialise the Adapter

Create an `src/lib/i18n.ts` file

```ts
// src/lib/i18n.ts
import { createI18n } from "@inlang/paraglide-js-adapter-next"
import type { AvailableLanguageTag } from "@/paraglide/runtime.js" //generated file

// All available functions exported. Just use the ones you need
export const {
	middleware,
	Link,
	useRouter,
	usePathname,
	redirect,
	permanentRedirect,
	localizePath,
} = createI18n<AvailableLanguageTag>()
```

<doc-accordion
	heading="Can I put this file somewhere else?"
	text="Sure, you can put it anywhere. Just be aware that you will be importing from this file a lot, so make sure it's somewhere convenient">
</doc-accordion>

### Step 3. Add the Middleware

In `src/middleware.ts`:

```ts
export { middleware } from "@/lib/i18n.js"
```

### Step 4. Add the Language Provider

In `src/app/layout.tsx` add the `<LanguageProvider>` component & set the lang attribute on your html element:

```tsx
import { LanguageProvider } from "@inlang/paraglide-js-adapter-next"
import { languageTag } from "@/paraglide/runtime"

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<LanguageProvider>
			{/* setting the lang attribute is important! */}
			<html lang={languageTag()}>
				<body>{children}</body>
			</html>
		</LanguageProvider>
	)
}
```

### Step 5. Use the localized navigation APIs

In order to get localised `<Link>`s you need to replace the ones from `next/link` with the ones from `@/lib/i18n.js`. Just find & replace the imports.

```diff
- import Link from "next/link"
+ import { Link } from "@/lib/i18n" 
```

The same goes for the other navigation APIs.

```diff
- import { usePathname, useRouter, redirect, permanentRedirect} from "next/navigation"
+ import { usePathname, useRouter, redirect, permanentRedirect} from "@/lib/i18n"
```

### Done!

You have set up localised routing! Try visiting `/de` or whatever language you have configured.

Use messages by importing them from `@/paraglide/messages.js`. By convention we do a wildcard import as `m`.

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

Only messages used in client components are sent to the client. Messages in Server Components don't impact bundle size.

## Usage

### Translated Metadata

To return different metadata for each language, we will need to use `generateMetadata`.

```ts
export async function generateMetadata() {
	return {
		title: m.home_metadata_title(),
		description: m.home_metadata_description(),
	}
}
```

> If you were to use `export const metadata` your metadata would always end up in the source language.

### Linking to Pages in other Languages

If you want a Link to be in a specific language you can use the `locale` prop.

```
<Link href="/about" locale="de">
```

This is convenient for constructing language switchers.

If you are using `router.push` to navigate you can pass `locale` as an option.

```ts
function Component() {
	const router = useRouter()
	return (
		<button onClick={() => router.push("/about", { locale: "de" })}>Go to German About page</button>
	)
}
```

### Excluding certain routes from i18n

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

By default the default language is the `sourceLanguageTag` defined in `project.inlang/settings.json`. You can change it with the `defaultLanguage` option.

```ts
export const { ... } =
	createI18n<AvailableLanguageTag>({
		defaultLanguage: "de"
	})
```

#### How language-detection works

The adapter follows these steps to determine the language.

- First, the adapter will try to determine the language based on the URL.
- If that fails, it will look for a `NEXT_LOCALE` cookie.
- If that isn't available either, it will try to negotiate the language based on the `Accept-Language` header.
- Finally it will fallback to the default language.

If a language has been determined once, it will set the `NEXT_LOCALE` cookie so that future ambiguities don't result in random language switches.

#### Translated Pathnames

You can use different pathnames for each language with the `pathname` option.

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

You can also use a message as a pathname

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

Be careful when using translated pathnames in combination with `prefix: "never"`. Links may not work if they are shared between people with different languages.

#### Getting a localised Pathname

There are situations where you need to know the localised version of a pathname. You can use the `localizePathname` function for that.

```ts
import { localizePathname } from "@/lib/i18n"
localizePathname("/about", "de") // de/ueber-uns
```

This does not include the `basePath`.

#### SEO

Search engines like Google expect you to tell them about translated versions of your pages. The adapter does this by default by adding the `Link` Header to requests.

You **don't** need to add the translated versions of your site to your sitemap, although it doesn't hurt if you do.

### Right-to-Left Support

Define a map of all languages to their text-direction & index into it.

```tsx
import { languageTag, type AvailableLanguageTag } from "@/paraglide/runtime.js"

// This is fully type-safe & forces you to keep it up-to-date
const direction: Record<AvailableLanguageTag, "rtl" | "ltr"> = {
	en: "ltr",
	ar: "rtl",
}

// src/app/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<LanguageProvider>
			<html lang={languageTag()} dir={direction[languageTag()]}>
	//...
```

> We discourage using the `Intl.Locale` API for text-direction as that's still poorly supported

## (legacy) Setup With the Pages Router

The Pages router already comes with [i18n support out of the box](https://nextjs.org/docs/advanced-features/i18n-routing). Thus, Paraglide doesn't need to provide it's own routing. All the Adapter does in the Pages router is react to the language change.

Add an `i18n` object to your `next.config.js` file. In it, specify the locales you want to support and the default locale. Make sure these match the ones in your `project.inlang/settings.json` file.

```js
module.exports = {
	i18n: {
		locales: ["en", "de"],
		defaultLocale: "en",
	},
}
```

> If you are using ESM for your NextJS config, you can also import `availableLanguageTags` and `sourceLanguageTag` from `./src/paraglide/runtime.js` and use them instead of hardcoding the locales.

NextJS will now automatically prefix all routes with the locale. For example, the route `/about` will become `/en/about` for the English locale and `/de/about` for the German locale. Only the default locale won't be prefixed.

Finally, wrap your `_app.js` file with the `ParaglideJS` component.

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

Don't forget to set the `lang` attribute on the `html` element in `src/pages/_document.js`.

```jsx
import { languageTag } from "@/paraglide/runtime"
import { Html, Head, Main, NextScript } from "next/document"

export default function Document() {
	return <Html lang={languageTag()}>...</Html>
}
```

## Known Limitations

There are some known limitation with this adapter:

- `output: static` isn't supported yet.
- Evaluating messages in the module-scope in server components always renders the source language.
- Server actions that aren't inside a tsx file will always read the default language, unless `setLanguageTag(()=>headers().get("x-language-tag"))` is called at the top of the file.

## Roadmap to 1.0

- Static Export support
- Simplify Setup
- Cookie & Domain Routing Strategies

## Examples

You can find example projects on our Github, or try them on StackBlitz:

- [App Router Example Repository](https://github.com/opral/monorepo/tree/main/inlang/source-code/paraglide/paraglide-js-adapter-next/examples/app)
- [App Router Example on StackBlitz](https://stackblitz.com/~/LorisSigrist/paraglide-next-app-router-example)
- [Pages Router Example](https://github.com/opral/monorepo/tree/main/inlang/source-code/paraglide/paraglide-js-adapter-next/examples/pages)
- [Pages Router Example on StackBlitz](https://stackblitz.com/~/LorisSigrist/paraglide-next-pages-router-example)
