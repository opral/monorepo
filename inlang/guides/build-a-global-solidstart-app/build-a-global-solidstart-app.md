# Build a global [SolidStart](https://start.solidjs.com/getting-started/what-is-solidstart) app

In this guide, you will learn how to set up ParaglideJS in your existing SolidStart project. We will cover:
- Project Setup
- Using ParaglideJS
- Internationalized Routing

## Getting started
This guide assumes that you already have a solidstart project set up. If you don't, follow the [official getting started guide](https://start.solidjs.com/getting-started/project-setup).

First, we will need to install [ParaglideJS](https://inlang.com/m/gerre34r/library-inlang-paraglideJs), aswell as the official [SolidStart adapter for Paraglide](https://inlang.com/m/n860p17j/paraglide-solidstart-i18n).

```bash
npx @inlang/paraglide-js@lates init
npm install @inlang/paraglide-js-adapter-solidstart
```

This will have done a few things. 

- Created an inlang project in your project root
- Added the required devDependencies to your `package.json`
- Created a `messages/` folder with a file for each language
- Added the paraglide compiler to your `package.json` build scripts

ParaglideJS is a compiler for your messages. It takes in message definitions and outputs javascript code that can be used in your app. This approach enables treeshaking and type safety. The SolidStart adapter for ParaglideJS provides a wrapper around the paraglide runtime to make it easier to use in your SolidStart app. It also provides internationalized routing.

If you now run `npm run build`, you should see the paraglide compiler running alongside the SolidStart compiler. By default the output will be placed in `./src/paraglide`. You will be importing all your messages / runtime code from this directory, so it might be worth setting up an alias for it. 

## Setting up the Vite Plugin (optional)
This step is optional, but recommended. The ParaglideJS vite plugin will automatically compile your messages whenever they change. This means you don't have to run `npm run build` every time you change a message. 

Install it by running `npm install @inlang/paraglide-js-adapter-vite` and add it to your `vite.config.js`:

```js
import { defineConfig } from 'vite'
import { paraglide } from '@inlang/paraglide-js-adapter-vite'

export default defineConfig({
  plugins: [
    paraglide({
      input: './project.inlang',
      oudir: './src/paraglide', //where the JS files will be placed
    }),
  ],
})
```

With this in place, you can now remove the `paraglide-js` commands in your `package.json` build scripts. The vite plugin will take care of compiling your messages.

## Adding and Using Messages

### Adding Messages

By default, paraglide uses the [inlang-message-format Plugin](https://inlang.com/m/reootnfj/plugin-inlang-messageFormat) for storing messages.

The default path for translation files are `./messages/{lang}.json`. You can change this option in `project.inlang/settings.json`. The Files just contain a Key-Value pair of the message ID and the message itself.

```json
// messages/en.json
{
	"$schema": "https://inlang.com/schema/inlang-message-format",
	"hello_world": "Hello World",
	"greeting": "Hello {name}"
}
```

You can add messages in two ways:

1. Manually editing the translation files
2. Using [Sherlock (VS Code extension)](https://inlang.com/m/r7kp499g/app-inlang-ideExtension)

### Add messages through Sherlock (VS Code extension) - recommended

- Install the Sherlock (VS Code extension) from the VS Code marketplace.
  [See extension on inlang.com](https://inlang.com/m/r7kp499g/app-inlang-ideExtension)
  [vs-code marketplace](https://marketplace.visualstudio.com/items?itemName=inlang.vs-code-extension)

- Reload window (only needed once).
  `⌘ or Ctrl` + `Shift` + `P` -> Developer: Reload Window. On the bottom it should display for some seconds after relaod: `inlang's extension activated`.

- Select a hard-coded string, for example, on the About page. Mark the string with your cursor and hit `command` + `.` -> Inlang: Extract
  message. Give the message an ID and hit enter.

- This command extracts the hard-coded string and places it into the source language translation file `en.json` in the `messages` directory.

### Using Messages

You can import messages into your code like this:

```ts
import * as m from "./paraglide/messages"

m.hello_world() // Hello World
m.greeting({ name: "John" }) // Hello John
```

Each message is a function that returns the message in the current language. If the message requires parameters, typescript will enforce that you pass them in.

You can change which language is currently active by using the `setLanguageTag` function exported from `$paraglide/runtime`.

```ts
import * as m from "./paraglide/messages"
import { setLanguageTag } from "./paraglide/runtime"

setLanguageTag("en")
m.hello_world() // Hello World
m.greeting({ name: "John" }) // Hello John

setLanguageTag("de")
m.hello_world() // Hallo Welt
m.greeting({ name: "John" }) // Hallo John
```

Messages are **not** reactive, so you will need to re-render your component when the language changes. We will see how to do that in the next step.


### Configuring Languages

You can edit the supported languages by editing the settings file `project.inlang/settings.json`.

```json
{
    "sourceLanguageTag": "en",
    "languageTags": ["en", "de", "ar"]
}
```

## Setting up the Adapter
The Adapter does a few very usefull things. It automatically sets the language tag for the current request. It also provides internationalized routing, so that you can navigate to translated versions of your pages.

You can initialize the Adapter by passing it the runtime generated by paraglide. Put this somewhere easy to access, like `src/i18n/index.ts`.

```ts
// src/i18n/index.ts (or wherever you want)
import * as paraglide from "./paraglide/runtime.js" // generated by paraglide
import { createI18n } from "@inlang/paraglide-js-adapter-solidstart"

export const { LanguageTagProvider, languageTag, setLanguageTag } = createI18n(paraglide)
```

Take a look at [the example](https://github.com/thetarnav/paraglide-solidstart-hackernews) to see this in action.

Once you have initialised the adapter, you can use it in your app root. 
    
```tsx
// root.tsx

import { Component, ErrorBoundary, Suspense } from "solid-js"
import { Body, FileRoutes, Head, Html, Routes, Scripts } from "solid-start"
import { LanguageTagProvider, useLocationLanguageTag } from "./i18n"
import { sourceLanguageTag, availableLanguageTags } from "./paraglide/runtime.js"

const Root: Component = () => {
	// get language tag from URL, or use source language tag as fallback
	const url_language_tag = useLocationLanguageTag(availableLanguageTags)
	const language_tag = url_language_tag ?? sourceLanguageTag

	// 1. provide language tag to your app
	// 2. set html lang attribute
	// 3. make sure the routing doesn't treat the language tag as part of the path

	return (
		<LanguageTagProvider value={language_tag}>
			<Html lang={language_tag}>
				<Head />
				<Body>
					<ErrorBoundary>
						<Suspense>
							<Routes base={url_language_tag}>
								<FileRoutes />
							</Routes>
						</Suspense>
					</ErrorBoundary>
					<Scripts />
				</Body>
			</Html>
		</LanguageTagProvider>
	)
}
export default Root
```

Take a look at [the example](https://github.com/thetarnav/paraglide-solidstart-hackernews) to see this in action.


That's all it takes to set up internationalized routing! If you have a page called `about` in your `src/pages` directory, you can now navigate to the translated version of that page by navigating to `/de/about`. The adapter will automatically set the language tag for the current request, and the router will ignore the language tag in the path. You don't need to rewrite any links to make this happen either. If you have a link to `/about` it will automatically be translated to include the correct language tag. 

## Switching languages
You can switch languages by calling the `setLanguageTag` function provided by the adapter. This will navigate to the translated variant of the current route.

``` ts
import { setLanguageTag } from "./i18n"

setLanguageTag("de") //causes a navigation to /de/<current-route>
```

If you want to navigate to a different route in a specific language, you can use the `translateHref` function provided by the adapter to generate the correct href. 

```tsx
<A href={translateHref("/about", "en")}>{m.about()}</A>
```

> ⚠️ Don't use the `translateHref` function on links that point to external websites. It'll break the link.


## Feedback
The Solid Adapter for Paraglide is still very young. If you have any feedback, please reach out to us on [Discord](https://discord.gg/CNPfhWpcAa), or open an issue on [GitHub](https://www.github.com/opral/monorepo/issues).