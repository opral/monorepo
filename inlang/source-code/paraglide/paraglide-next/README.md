![Dead Simple i18n. Typesafe, Small Footprint, SEO-Friendly and, IDE Integration.](https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/source-code/paraglide/paraglide-next/assets/header.png)

<doc-features>
<doc-feature text-color="#0F172A" color="#E1EFF7" title="Internationalized Routing" image="https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/source-code/paraglide/paraglide-next/assets/i18n-routing.png"></doc-feature>
<doc-feature text-color="#0F172A" color="#E1EFF7" title="Tiny Bundle Size" image="https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/source-code/paraglide/paraglide-next/assets/bundle-size.png"></doc-feature>
<doc-feature text-color="#0F172A" color="#E1EFF7" title="No route Param needed" image="https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/source-code/paraglide/paraglide-next/assets/no-param.png"></doc-feature>
</doc-features>

# People Love It

<doc-comments>
<doc-comment text="Awesome library 🙂 Thanks so much! 1) The docs were simple and straight forward 2) Everything just worked.. no headaches" author="Dimitry" icon="mdi:discord" data-source="https://discord.com/channels/897438559458430986/1083724234142011392/1225658097016766574"></doc-comment>
<doc-comment text="Thank you for that huge work you have done and still doing!" author="ZerdoX-x" icon="mdi:github"></doc-comment>
</doc-comments>

# Getting Started

Get started instantly with the Paraglide-Next CLI.

```bash
npx @inlang/paraglide-next init
npm install
```

The CLI will ask you which languages you want to support. This can be changed later.

It will:

- Create an [Inlang Project](https://inlang.com/documentation/concept/project)
- Create translation files for each of your languages
- Add necessary Provider Components and files
- Update your `next.config.js` file to use the Paraglide-Next Plugin.
- Offer to automatically migrate to the [Localized navigation APIs](#localized-navigation-apis) if you're using the App Router (recommended)

You can now start your development server and visit `/de`, `/ar`, or whatever languages you've set up.

## Creating and Using Messages

Your messages live in `messages/{languageTag}.json` files. You can add messages in these files as key-value pairs of the message ID and the translations.

Use curly braces to add parameters.

```json
// messages/en.json
{
	// The $schema key is automatically ignored
	"$schema": "https://inlang.com/schema/inlang-message-format",

	"hello_world": "Hello World!",
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

### Linking to Pages in Specific Languages

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

### Setting the Language in Server Actions

Use the `initializeLanguage` function at the top of your server-action file to make sure the language is available.

```ts
// src/app/actions.ts
"use server"
import { initializeLanguage } from "@inlang/paraglide-next"
import { languageTag } from "@/paraglide/runtime"

initializeLanguage() //call it at the top of the file

export async function someAction() {
	languageTag() // "de"
}
```

## Manually Getting a localized Pathname

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

### Chaining Middleware

You can chain `paraglide-next`'s middleware with your own by calling it inside your own middleware function. You need to pass it the request and use the returned response.

```ts
// src/middleware.ts
import { middleware as paraglide } from "@/lib/i18n"
export default function middleware(request: NextRequest) {
	//do something with the request

	const response = paraglide(request)

	// do something with the response
	return response
}
```

## Roadmap to 1.0

- Static Export support
- Simplify Setup
- More flexible Routing Strategies

# Examples

You can find example projects in [our GitHub repository](https://github.com/opral/monorepo/tree/main/inlang/source-code/paraglide/paraglide-next/examples), or try them on StackBlitz:

<doc-links>
    <doc-link title="App Router Example" icon="simple-icons:stackblitz" href="https://stackblitz.com/~/LorisSigrist/paraglide-next-app-router-example" description="Try out the App router example on StackBlitz"></doc-link>
    <doc-link title="App Router Example Repository" icon="lucide:github" href="https://github.com/opral/monorepo/tree/main/inlang/source-code/paraglide/paraglide-next/examples/app" description="View the source code for the App router Example"></doc-link>
    <doc-link title="Pages Router Example" icon="simple-icons:stackblitz" href="https://stackblitz.com/~/LorisSigrist/paraglide-next-app-router-example" description="Try out the Pages router example on StackBlitz"></doc-link>
	<doc-link title="App Router Example Repository" icon="lucide:github" href="https://github.com/opral/monorepo/tree/main/inlang/source-code/paraglide/paraglide-next/examples/pages" description="View the source code for the Pages router Example"></doc-link>
</doc-links>
