[<img src="https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/source-code/paraglide/paraglide-js/assets/header.png" alt="Dead Simple i18n. Typesafe, Small Footprint, Treeshsakeable Messages, IDE Integration, Framework Agnostic" width="10000000px" />](https://www.youtube.com/watch?v=-YES3CCAG90)

# Why Paraglide?

<doc-features>
  <doc-feature title="Tiny Runtime" image="https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/source-code/paraglide/paraglide-js/assets/bundlesize-feature.png"></doc-feature>
  <doc-feature title="Fully Typesafe" image="https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/source-code/paraglide/paraglide-js/assets/typesafety-feature.png"></doc-feature>
  <doc-feature title="Only Ship Used Messages" image="https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/source-code/paraglide/paraglide-js/assets/unused-translations.png"></doc-feature>
   <doc-feature title="Sherlock VsCode Extension" image="https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/source-code/paraglide/paraglide-js/assets/sherlock-preview.png"></doc-feature>
</doc-features>


With Paraglide's Treeshsakeable messages, each page only loads the messages it actually uses. Incremental loading like this would usually take forever to get right, with Paraglide you get it for free.

# Use it with your Favorite Framework

Paraglide is framework agnostic, but it's even better if you pair it with a framework specific library. If you are using one of these frameworks you will want to follow the framework specific documentation instead. If you aren't, that's fine too! You can read on.

<doc-links>
	<doc-link title="Adapter for NextJS" icon="tabler:brand-nextjs" href="/m/osslbuzt/paraglide-next-i18n" description="Go to Library"></doc-link>
    <doc-link title="Adapter for SvelteKit" icon="simple-icons:svelte" href="/m/dxnzrydw/paraglide-sveltekit-i18n" description="Go to Library"></doc-link>
    <doc-link title="Adapter for Astro" icon="devicon-plain:astro" href="/m/iljlwzfs/paraglide-astro-i18n" description="Go to Library"></doc-link>
    <doc-link title="Adapter for SolidJS" icon="tabler:brand-solidjs" href="/m/n860p17j/paraglide-solidstart-i18n" description="Go to Library"></doc-link>
	<doc-link title="Adapter for Remix" icon="simple-icons:remix" href="/m/fnhuwzrx/paraglide-remix-i18n" description="Go to Library"></doc-link>
	<doc-link title="Or write your own" icon="ph:sparkle-fill" href="#writing-an-adapter" description="Learn How"></doc-link>
</doc-links>

# People Love It

Here are a few comments we've received recently.

<doc-comments>
<doc-comment text="Just tried Paraglide JS from @inlangHQ. This is how i18n should be done! Totally new level of DX for both implementation and managing translations! Superb support for SvelteKit as well ⭐" author="Patrik Engborg" icon="mdi:twitter" data-source="https://twitter.com/patrikengborg/status/1747260930873053674"></doc-comment>
<doc-comment text="I was messing with various i18n frameworks and tools in combination with Astro, and i must say that Paraglide was the smoothest experience. I have migrated my website from i18next and it was a breeze. SSG and SSR worked out of the box (which was the first one for me), and overall DX is great. Thanks for your work!" author="Dalibor Hon" icon="mdi:discord" data-source="https://discord.com/channels/897438559458430986/1096039983116202034/1220796380772307004"></doc-comment>
<doc-comment text="The lib is great guys!" author="ktarmyshov" icon="mdi:github"></doc-comment>
<doc-comment text="Thank you for that huge work you have done and still doing!" author="ZerdoX-x" icon="mdi:github"></doc-comment>
</doc-comments>

# Getting started

To use Paraglide stanadlone without a framework, run the following command:

```bash
npx @inlang/paraglide-js@latest init
```

This will:

- Install necessary dependencies
- Generate a `messages/` folder where your translation files live
- Add the Paraglide compiler to your `build` script
- Create necessary configuration files

Running the paraglide compiler will generate a `src/paraglide` folder. This folder contains all the code that you need to use paraglide-js.

## Adding and Editing Messages

Messages are stored in `messages/{lang}.json`. To add a message simply add a key-value pair. You can add parameters with curly braces.

```diff
// messages/en.json
{
	"$schema": "https://inlang.com/schema/inlang-message-format",
+ 	"greeting": "Hello {name}!"
}
```

Make sure to re-run the paraglide compiler after editing your messages.

```
npx @inlang/paraglide-js compile --project ./project.inlang
```

If you are using Vite, you can instead use the [paraglide vite-plugin](https://github.com/opral/monorepo/tree/main/inlang/source-code/paraglide/paraglide-js-adapter-vite) to do this automatically.

## Using Messages in Code

After running the compiler, you can import messages with `import * as m from "./paraglide/messages"`.

```js
import * as m from "./paraglide/messages.js"
import { setLanguageTag } from "./paraglide/runtime.js"

m.hello() // Hello world!
m.loginHeader({ name: "Samuel" }) // Hello Samuel, please login to continue.
```

To choose between messages at runtime create a map of messages and index into it.

```ts
import * as m from "./paraglide/messages.js"

const season = {
	spring: m.spring,
	summer: m.summer,
	autumn: m.autumn,
	winter: m.winter,
} as const

const msg = season["spring"]() // Hello spring!
```

## Configuration

You can configure the languages you intend to support

### Languages

You can declare which languages you support in `./project.inlang/settings.json`.

```json
// project.inlang/settings.json
{
	"languageTags": ["en", "de"]
}
```

Then create another `messages/{lang}.json` file and get translating!

## Setting the language

You can set the [language tag](https://www.inlang.com/m/8y8sxj09/library-inlang-languageTag) by calling `setLanguageTag()`. Any subsequent calls to either `languageTag()` or a message function will use the new language tag.

```js
import { setLanguageTag } from "./paraglide/runtime.js"
import * as m from "./paraglide/messages.js"

setLanguageTag("de")
m.hello() // Hallo Welt!

setLanguageTag("en")
m.hello() // Hello world!
```

The [language tag](https://www.inlang.com/m/8y8sxj09/library-inlang-languageTag) is global, so you need to be careful with it on the server to make sure multiple requests don't interfere with each other.

You will need to call `setLanguageTag` on both the server and the client, since they run in separate processes.

## Reacting to language changes

Messages aren't reactive, so you will need to trigger a re-render when the language changes. You can register a callback using `onSetLanguageTag()`. It is called whenever the [language tag](https://www.inlang.com/m/8y8sxj09/library-inlang-languageTag) changes.

If you are using an adapter this is likely done for you.

```js
import { setLanguageTag, onSetLanguageTag } from "./paraglide/runtime.js"
import * as m from "./paraglide/messages.js"

onSetLanguageTag((newLanguageTag) => {
	console.log(`The language changed to ${newLanguageTag}`)
})

setLanguageTag("de") // The language changed to de
setLanguageTag("en") // The language changed to en
```

There are a few things to know about `onSetLanguageTag()`:

- You can only register one listener. If you register a second listener it will throw an error.
- `setLanguageTag` shouldn't be used on the server.

## Getting a message in a specific language

You can import a message in a specific language from `paraglide/messages/{lang}.js`.

```ts
import * as m from "./paraglide/messages/de.js"
m.hello() // Hallo Welt
```

If you want to force a language, but don't know _which_ language ahead of time you can pass the `languageTag` option as the second parameter to a message function. This is often handy on the server.

```js
import * as m from "./paraglide/messages.js"
const msg = m.hello({ name: "Samuel" }, { languageTag: "de" }) // Hallo Samuel!
```

## Lazy-Loading

Paraglide consciously discourages lazy-loading translations since it seriously hurts
your web-vitals. Learn more about why lazy-loading is bad & what to do instead in [this blog post](https://inlang.com/g/mqlyfa7l/guide-lorissigrist-dontlazyload).

If you _really_ want to do it anway, you can lazily import the language-specific message files. Be careful with this.

```ts
const lazyGerman = await import("./paraglide/messages/de.js")
lazyGerman.hello() // Hallo Welt
```

## Usage with a Bundler

If you are using a bundler you should use the corresponding plugin. The plugin will keep your message-functions up-to-date by compiling whenever your messages change and before build.

<doc-links>
	<doc-link title="Vite Plugin" icon="tabler:brand-vite" href="https://github.com/opral/monorepo/tree/main/inlang/source-code/paraglide/paraglide-js-adapter-vite" description="Go to Github"></doc-link>
    <doc-link title="Rollup Plugin" icon="file-icons:rollup" href="https://github.com/opral/monorepo/tree/main/inlang/source-code/paraglide/paraglide-js-adapter-rollup" description="Go to Github"></doc-link>
    <doc-link title="Webpack Plugin" icon="mdi:webpack" href="https://github.com/opral/monorepo/tree/main/inlang/source-code/paraglide/paraglide-js-adapter-webpack" description="Go to Github"></doc-link>
</doc-links>

# Playground

Find examples for how to use paraglide on codesandbox or in [our GitHub repository](https://github.com/opral/monorepo/tree/main/inlang/source-code/paraglide).

<doc-links>
    <doc-link title="NextJS + Paraglide JS" icon="lucide:codesandbox" href="https://stackblitz.com/~/LorisSigrist/paraglide-next-app-router-example" description="Play around with NextJS and Paraglide JS"></doc-link>
    <doc-link title="Svelte + Paraglide JS" icon="lucide:codesandbox" href="https://stackblitz.com/~/github.com/LorisSigrist/paraglide-sveltekit-example" description="Play around with Svelte and Paraglide JS"></doc-link>
    <doc-link title="Astro + Paraglide JS" icon="lucide:codesandbox" href="https://stackblitz.com/~/github.com/LorisSigrist/paraglide-astro-example" description="Play around with Astro and Paraglide JS"></doc-link>
</doc-links>

# Architecture

ParaglideJS leverages a compiler to generate vanilla JavaScript functions from your messages. We call these "message functions".

Message Functions are fully typed using JSDoc. They are exported individually from the `messages.js` file making them tree-shakable. They aren't reactive, they just return a string.

This avoids many edge cases associated with reactivity, lazy-loading and namespacing that other i18n libraries have to work around.

In addition to the message functions, ParaglideJS also emits a runtime. The runtime is used to set the language tag. It contains less than 50 LOC (lines of code) and is less than 300 bytes minified & gzipped.

![paraglide JS architecture](https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/source-code/paraglide/paraglide-js/assets/architecture.svg)

Paraglide consists of four main parts:

| Part         | Description                                                                                                                  |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| **Compiler** | Compiles messages into tree-shakable message functions                                                                       |
| **Messages** | The compiled tree-shakable message functions                                                                                 |
| **Runtime**  | A runtime that resolves the [language tag](https://www.inlang.com/m/8y8sxj09/library-inlang-languageTag) of the current user |
| **Adapter**  | (optional) An adapter that adjusts the runtime for different frameworks                                                      |

## Compiler

The compiler loads an Inlang project and compiles the messages into tree-shakable and typesafe message functions.

**Input**

```js
// messages/en.json
{
  "hello": "Hello {name}!"
}
```

**Output**

```js
// src/paraglide/messages/en.js

/**
 * @param {object} params
 * @param {string} params.name
 */
export const hello = (params) => `Hello ${params.name}!`
```

## Messages

By convention we import the compiled funcitions with a wildcard import.

```js
import * as m from "../paraglide/messages.js"
```

Bundlers like Rollup, Webpack, or Turbopack tree-shake the messages that are not used, so using a wildcard import is perfectly fine.

# Writing an Adapter

An "Adapter" is a library that integrates with a framework's liefcycle and does two things:

1. Calls `setLanguageTag()` at appropriate times to set the language
2. Reacts to `onSetLanguageTag()`, usually by navigating or relading the page.

This example adapts Paraglide to a fictitious fullstack framework.

```tsx
import {
	setLanguageTag,
	onSetLanguageTag,
	type AvailableLanguageTag,
} from "../paraglide/runtime.js"
import { isServer, isClient, request, render } from "@example/framework"
import { detectLanguage } from "./utils.js"

if (isServer) {
	// On the server the language tag needs to be resolved on a per-request basis.
	// Pass a getter function that resolves the language from the correct request

	const detectLanguage = (request: Request): AvailableLanguageTag => {
		//your logic ...
	}
	setLanguageTag(() => detectLanguage(request))
}

if (isClient) {
	// On the client, the language tag can be resolved from
	// the document's html lang tag.
	setLanguageTag(() => document.documentElement.lang)

	// When the language changes we want to re-render the page in the new language
	// Here we just navigate to the new route
	//
	// Make sure to call `onSetLanguageTag` after `setLanguageTag` to avoid an infinite loop.
	onSetLanguageTag((newLanguageTag) => {
		window.location.pathname = `/${newLanguageTag}${window.location.pathname}`
	})
}

// Render the app once the setup is done
render((page) => (
	<html lang={request.languageTag}>
		<body>{page}</body>
	</html>
))
```

# Roadmap

Of course, we're not done yet! We plan on adding the following features to Paraglide JS soon:

- [ ] Pluralization ([Join the Discussion](https://github.com/opral/monorepo/discussions/2025))
- [ ] Formatting of numbers and dates ([Join the Discussion](https://github.com/opral/monorepo/discussions/992))
- [ ] Markup Placeholders ([Join the Discussion](https://github.com/opral/monorepo/discussions/913))
- [ ] Even Smaller Output

# Talks

- [Svelte Summit Spring 2023](https://www.youtube.com/watch?v=Y6IbPfMU1xM)
- [Svelte Summit Fall 2023](https://www.youtube.com/watch?v=-YES3CCAG90)
- Web Zurich December 2023
- [Svelte London January 2024](https://www.youtube.com/watch?v=eswNQiq4T2w&t=646s)

# Tooling

Paraglide JS is part of the Inlang ecosystem and integrates nicely with all the other Inlang compatible tools.

As a developer, you will love the [Sherlock VsCode extension](https://inlang.com/m/r7kp499g/app-inlang-ideExtension).

If you are working with translators or designers you will find these tools useful:

- [Fink](https://inlang.com/m/tdozzpar/app-inlang-finkLocalizationEditor) - An Online UI for editing translations. Changes made in Fink are committed to a translation branch or submitted via pull request.
- [Parrot](https://inlang.com/m/gkrpgoir/app-parrot-figmaPlugin) - A Figma Plugin for previewing translations right in your Figma designs. This avoids any layout issues that might occur due to different text lengths in different languages.

# Pricing

<doc-pricing></doc-pricing>
