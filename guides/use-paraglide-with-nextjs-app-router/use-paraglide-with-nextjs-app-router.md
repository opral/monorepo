# Using ParaglideJS with Next.js' App Router

In this guide we will use [Paraglide.js](https://inlang.com/m/gerre34r/library-inlang-paraglideJs), [inlang-message-format](https://inlang.com/m/reootnfj/plugin-inlang-messageFormat) and [inlang's IDE Extension](https://inlang.com/m/r7kp499g/app-inlang-ideExtension).

Translated string(s) in this guide might be referred to as message(s) or translation(s).

## 1. Starting point

This guide assumes that you have a Next.js project set up, and you are using the app router. If you don't, you can follow the [official Next.js guide](https://nextjs.org/docs/getting-started/installation) to get started.

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

By default Paraglide uses [inlang-message-format](https://inlang.com/m/reootnfj/plugin-inlang-messageFormat) plugin to load messages. If you look in your Inlang project settings you will see the `pathPattern` option specifiing _where_ translation files should be stored.

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

Let's use the `hello_world` message on our homepage. Open `app/page.tsc`, import all messages from `paraglide/messages.js` and use the `hello_world` message in the `h1` tag.

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

If you now call `setLanguageTag("de")` before rendering the message, you should see the german translation. At least for the Server Components

```jsx
import * as m from "@/paraglide/messages"
import { setLanguageTag } from "@/paraglide/runtime"

export default function Home() {
  setLanguageTag("de")
	return (
		<div>
			<h1>{m.hello_world()}</h1> // <-- Hallo Welt!
		</div>
	)
}
```

## 5. Setting up i18n routing

Since the App router renders on the server by default we can't just add a button to switch languages. That wouldn't rerender the server-rendered parts of the page. Instead we will need to do a navigation to switch languages.

There are many ways of implementing i18n routing. This guide will implement the following behaviour:

- `/some-page` - Redirect to default language (Eg. `/en/some-page`)
- `/en/some-page` - English
- `/de/some-page` - German

The code created here shouldn't be too hard to adapt to different routing behaviour, in case you need something else.

### Setting the Language with a URL Parameter

We will start by adding a URL parameter to our routes. This will match the `/en` and `/de` bits of our routes. Let's move all our routes into a `[lang]` folder. This will prefix all our routes with a language parameter.

```
app/
├── [lang]
│   ├── layout.tsx
│   └── page.tsx
```

In order to manage the language parameter, we will need to add some middleware. This will do a few things:

- Make sure that the language parameter is a valid [language tag](/m/8y8sxj09/library-inlang-languageTag)
- Redirect to the default language if no language parameter is present
- Make the [language tag](/m/8y8sxj09/library-inlang-languageTag) available to our pages via a Header

Add a `src/middleware.ts` file with the following code:

```ts
import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { AvailableLanguageTag, availableLanguageTags, sourceLanguageTag } from "./paraglide/runtime"

/**
 * Sets the request headers to resolve the language tag in RSC.
 *
 * https://nextjs.org/docs/pages/building-your-application/routing/middleware#setting-headers
 */
export function middleware(request: NextRequest) {
	//Get's the first segment of the URL path
	const maybeLocale = request.nextUrl.pathname.split("/")[1]

	//If it's not a valid language tag, redirect to the default language
	if (!availableLanguageTags.includes(maybeLocale as any)) {
		const redirectUrl = `/${sourceLanguageTag}${request.nextUrl.pathname}`
		request.nextUrl.pathname = redirectUrl
		return NextResponse.redirect(request.nextUrl)
	}

	//it _IS_ a valid language tag, so set the language tag header
	const locale = maybeLocale as AvailableLanguageTag

	const headers = new Headers(request.headers)
	headers.set("x-language-tag", locale)

	return NextResponse.next({
		request: {
			headers,
		},
	})
}

export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - api (API routes)
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 */
		"/((?!api|_next/static|_next/image|favicon.ico).*)",
	],
}
```

When you run the dev server now and visit `/` you should be redirected to `/en`. It won't switch languages yet, we will do that in the next step.

We still need to inform Paraglide about the [language tag](/m/8y8sxj09/library-inlang-languageTag). We will need to do this on both the server and the client. We will use two components to do this. One for the server and one for the client.

Create a `LanguageProvider.tsx` server component wherever you want. I will put it in `src/lib/LanguageProvider.tsx`. All this component does is get the language from the request header that was set by our middleware and set it in Paraglide.

```jsx
// src/lib/LanguageProvider.tsx
import { setLanguageTag } from "@/paraglide/runtime"
import { headers } from "next/headers"


//This only needs to be called once, so it's fine to do it here
setLanguageTag(() => {
	return headers().get("x-language-tag") as any
})

export default function LanguageProvider(props: { children: React.ReactNode }) {
	return (
		<>
			{props.children}
		</>
	)
}
```

Then wrap your Layout with this component. Make sure that it is the outermost component, since no translation will work without it. This is also a good opportunity to set the `lang` attribute on the `html` tag.

```jsx
// src/app/[lang]/layout.tsx
import LanguageProvider from "@/lib/LanguageProvider"
import { languageTag } from "@/paraglide/runtime"

export default function RootLayout({ children }: { children: React.ReactNode }) {
	//The LanguageProvider component needs to come before any use of the `languageTag` function
	return (
		<LanguageProvider>
			<html lang={languageTag()}>
				<body>{children}</body>
			</html>
		</LanguageProvider>
	)
}
```

If you now run the dev server, and visit `/en` and `/de`, you should see the Server Components switch languages. The Client Components won't switch languages yet, let's fix that next.

Add a `ClientLanguageProvider.tsx` client component that takes in the [language tag](/m/8y8sxj09/library-inlang-languageTag) as a prop and sets it in Paraglide.

```jsx
// src/lib/ClientLanguageProvider.tsx
"use client"
import { AvailableLanguageTag, setLanguageTag } from "@/paraglide/runtime"

export function ClientLanguageProvider(props: { language: AvailableLanguageTag }) {
	setLanguageTag(props.language)
	return null
}
```

Then use this component in the `LanguageProvider` component. Make it a siblint to the rest of the children, so that it won't turn your whole page into a client component.

```jsx
// src/lib/LanguageProvider.tsx
import { ClientLanguageProvider } from "@/lib/ClientLanguageProvider"
import { setLanguageTag, languageTag } from "@/paraglide/runtime"

setLanguageTag(() => {
	return headers().get("x-language-tag") as any
})

export default function LanguageProvider(props: { children: React.ReactNode }) {
	return (
		<>
			<ClientLanguageProvider language={languageTag()} />
			{props.children}
		</>
	)
}
```

When you now visit `/en` and `/de` you should see the Client Components switch languages as well.

You can switch langauges by linking to the same page with a different language parameter. This can be done with an `<a>` tag or with a programmatic navigation.

## 6. Next Steps

That's it! You should now have a fully functional multilingual NextJS app using ParaglideJS. Wasn't that hard was it?

You can check out the full source code of this example [here](https://github.com/inlang/monorepo/tree/main/inlang/source-code/paraglide/paraglide-js-adapter-next/example-app).

If you want to learn more about ParaglideJS, check out the [ParaglideJS Documentation](https://inlang.com/m/gerre34r/library-inlang-paraglideJs). If you need help or have some ideas, feel free to reach out to us on [Discord](https://discord.gg/gdMPPWy57R) or open a Discussion on [GitHub](https://github.com/inlang/monorepo/discussions).

Happy Coding!
