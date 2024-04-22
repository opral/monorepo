![Dead Simple i18n. Typesafe, Small Footprint, SEO-Friendly and IDE Integration.](https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/source-code/paraglide/paraglide-next/assets/header.png)

<doc-features>
<doc-feature text-color="#0F172A" color="#E1EFF7" title="Internationalized Routing" image="https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/source-code/paraglide/paraglide-next/assets/i18n-routing.png"></doc-feature>
<doc-feature text-color="#0F172A" color="#E1EFF7" title="Tiny Bundle Size" image="https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/source-code/paraglide/paraglide-next/assets/bundle-size.png"></doc-feature>
<doc-feature text-color="#0F172A" color="#E1EFF7" title="No route Param needed" image="https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/source-code/paraglide/paraglide-next/assets/no-param.png"></doc-feature>
</doc-features>

## Getting Started

Get started instantly with the Paraglide-Next CLI.

```bash
npx @inlang/paraglide-next init
npm install
```

The CLI will ask you which languages you want to support. This can be changed later. 

It will:
- Create an Inlang Project
- Create translation files for each of your languages
- Create a middleware file
- Create `lib/i18n.ts` file
- Update your `next.config.js` file to use the Paraglide-Next Plugin.
- Add the `<LanguageProvider>` wrapper to your `app/layout.tsx` component.

You can now start your dev-server and visit `/de`, `/ar`, or whatever languages you've set up.

## Adding Messages

Your messages live in `messages/{languageTag}.json` files. You can add messages in these files as key-value pairs of the message ID and the translations.

Use curly braces to add parameters.

```json
// messages/en.json
{
	// The $schema key is automatically ignored
	"$schema": "https://inlang.com/schema/inlang-message-format",

	"hello_world" : "Hello World!",
	"greetings": "Greetings {name}."
}
```

Learn more about the format in the [Inlang Message Format Documentation](https://inlang.com/m/reootnfj/plugin-inlang-messageFormat).

## Using Messages in Code
Use messages by importing them from `@/paraglide/messages.js`. By convention, we do a wildcard import as `m`.

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

## Localized navigation APIs

While you can now visit `/de/some-page` you still need to add the language-prefix to every single link. Wouldn't it be nice if that happened automatically? 

For this, the package provides Localised Navigation APIs. These are exported from `@/lib/i18n.js`.

To get localized `<Link>`s you need to replace the ones from `next/link` with the ones from `@/lib/i18n.js`. Just find & replace the imports.

```diff
- import Link from "next/link"
+ import { Link } from "@/lib/i18n" 

// This now links to /de/about depending on the current language
<Link href="/about"> 
```

You can do the same for the other navigation APIs.

```diff
- import { usePathname, useRouter, redirect, permanentRedirect} from "next/navigation"
+ import { usePathname, useRouter, redirect, permanentRedirect} from "@/lib/i18n"
```

## Advanced Usage

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

### Linking to Pages in Other Languages

If you want a Link to be in a specific language you can use the `locale` prop.

```tsx
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

By default, the default language is the `sourceLanguageTag` defined in `project.inlang/settings.json`. You can change it with the `defaultLanguage` option.

```ts
export const { ... } =
	createI18n<AvailableLanguageTag>({
		defaultLanguage: "de"
	})
```

#### How language-detection works

Paraglide-Next follows these steps to determine the language.

- First, it will try to determine the language based on the URL.
- If that fails, it will look for a `NEXT_LOCALE` cookie.
- If that isn't available either, it will try to negotiate the language based on the `Accept-Language` header.
- Finally, it will fall back to the default language.

If a language has been determined once, it will set the `NEXT_LOCALE` cookie so that future ambiguities don't result in random language switches.

#### Translated Pathnames

You can use different pathnames for each language with the `pathname` option.
Pathnames should not include a language prefix or the base path.

```ts
export const { ... } =
	createI18n<AvailableLanguageTag>({
		pathname: {
			"/about": {
				en: "/about",
				de: "/ueber-uns"
			}
		}
	})
```
 
You can use parameters in pathnames with square brackets. You have to use an identical set of parameters in both the canonical and translated pathnames.

You can use double-square brackets for optional parameters and the spread operator to make it a match-all parameter.

```ts
pathname: {
	"/articles/[slug]": {
		en: "/articles/[slug]",
		de: "/artikel/[slug]"
	},
	"/admin/[...rest]": {
		en: "/administration/[...rest]",
		de: "/admin/[...rest]"
	},
}
```

You can also use a message as a pathname. The translation will be used as the pathname. You can use parameters here too. 

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

#### Getting a localized Pathname

There are situations where you need to know the localized version of a pathname. You can use the `localizePathname` function for that.

```ts
import { localizePathname } from "@/lib/i18n"
localizePathname("/about", "de") // de/ueber-uns
```

This does not include the `basePath`.

### Alternate Links

Search engines like Google expect you to tell them about translated versions of your pages. Paraglide-Next does this by default by adding the `Link` Header to requests.

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

> We discourage using the `Intl.Locale` API for text-direction as it's still poorly supported

## (Legacy) Setup With the Pages Router

The Pages router already comes with [i18n support out of the box](https://nextjs.org/docs/advanced-features/i18n-routing). Thus, Paraglide doesn't need to provide routing. All Paraglide-Next does in the Pages router is react to the language change & run the compiler.

In `next.config.js`, add the `paraglide` plugin.
```js
const { paraglide } = require("@inlang/paraglide-next/plugin")
module.exports = paraglide({
	paraglide: {
		project: "./project.inlang",
		outdir: "./src/paraglide",
	}
})
```

Then add an `i18n` object and specify the locales you want to support. Make sure these match the ones in your `project.inlang/settings.json` file.

```js
module.exports = paraglide({
	paraglide: {
		project: "./project.inlang",
		outdir: "./src/paraglide",
	},
	i18n: {
		locales: ["en", "de"],
		defaultLocale: "en",
	},
})
```

NextJS will automatically prefix all routes with the locale. For example, the route `/about` will become `/en/about` for the English locale and `/de/about` for the German locale. Only the default locale won't be prefixed.

Finally, wrap your `_app.js` file with the `ParaglideJS` component.

```jsx
import { ParaglideJS } from "@inlang/paraglide-next/pages"

export default function App({ Component, pageProps }: AppProps) {
	return (
		<ParaglideJS>
			<Component {...pageProps} />
		</ParaglideJS>
	)
}
```

You can now use Paraglide's messages in your components.

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

There are some known limitations with Paraglide-Next.

- `output: static` isn't supported yet.
- Evaluating messages in module scope always renders the source language.
- Server actions that aren't inside a `.tsx` file will always read the default language unless `setLanguageTag(()=>headers().get("x-language-tag"))` is called at the top of the file.

## Roadmap to 1.0

- Static Export support
- Simplify Setup
- Cookie & Domain Routing Strategies

## Examples

You can find example projects in [our GitHub repository](https://github.com/opral/monorepo/tree/main/inlang/source-code/paraglide-next/examples), or try them on StackBlitz:

<doc-links>
    <doc-link title="App Router Example" icon="simple-icons:stackblitz" href="https://stackblitz.com/~/LorisSigrist/paraglide-next-app-router-example" description="Try out the App router example on StackBlitz"></doc-link>
    <doc-link title="App Router Example Repository" icon="lucide:github" href="https://github.com/opral/monorepo/tree/main/inlang/source-code/paraglide/paraglide-next/examples/app" description="View the source code for the App router Example"></doc-link>
    <doc-link title="Pages Router Example" icon="simple-icons:stackblitz" href="https://stackblitz.com/~/LorisSigrist/paraglide-next-app-router-example" description="Try out the Pages router example on StackBlitz"></doc-link>
	<doc-link title="App Router Example Repository" icon="lucide:github" href="https://github.com/opral/monorepo/tree/main/inlang/source-code/paraglide/paraglide-next/examples/pages" description="View the source code for the Pages router Example"></doc-link>
</doc-links>
