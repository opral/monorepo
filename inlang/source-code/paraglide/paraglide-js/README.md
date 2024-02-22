[<img src="https://cdn.loom.com/sessions/thumbnails/a8365ec4fa2c4f6bbbf4370cf22dd7f6-with-play.gif" width="100%" /> Watch the demo of Paraglide JS](https://www.youtube.com/watch?v=-YES3CCAG90)

<!-- ![Paraglide JS header image](https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/source-code/paraglide/paraglide-js/assets/paraglide-js-header.png) -->

# Simple, adaptable, and tiny i18n library for JS

Get started instantly with the following command:

```bash
npx @inlang/paraglide-js@latest init
```

# Features

<doc-features>
  <doc-feature title="No unused translations" image="https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/source-code/paraglide/paraglide-js/assets/unused-translations.png"></doc-feature>
  <doc-feature title="Minimal payload" image="https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/source-code/paraglide/paraglide-js/assets/reduced-payload.png"></doc-feature>
  <doc-feature title="Typesafety" image="https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/source-code/paraglide/paraglide-js/assets/typesafe.png"></doc-feature>
</doc-features>

### Treeshaking

<doc-figure src="https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/source-code/paraglide/paraglide-js/assets/tree-shaking.jpg" alt="An illustration explaining the benefits of treeshaking in software" caption="How Paraglide JS treeshaking works">
</doc-figure>

Treeshaking gives us superpowers. With it, each page of your app only loads the messages that it actually uses. Incremental loading like this would usually take hours of manual tweaking to get right. With Paraglide-JS you get it for free. Say goodbye to huge bundles.

# Getting started

### 1. Initialize paraglide-js

You can initialize paraglide-js by running the following command in your terminal:

```bash
npx @inlang/paraglide-js@latest init
```

This will:

1. Install the necessary dependencies
2. Call the Paraglide compiler in your `build` script
3. Set up any necessary configuration files

### 2. Set up an adapter (optional)

Adapters are framework specific integrations for Paraglide. If you are using a framework, using an adapter is recommended (but not required). If you don't use a framework, you can skip this step.

<doc-links>
    <doc-link title="Adapter for SvelteKit" icon="simple-icons:svelte" href="https://inlang.com/m/dxnzrydw/library-inlang-paraglideJsAdapterSvelteKit" description="Go to Library"></doc-link>
    <doc-link title="Adapter for SolidJS" icon="tabler:brand-solidjs" href="https://inlang.com/m/n860p17j/library-inlang-paraglideJsAdapterSolidStart" description="Go to Library"></doc-link>
    <doc-link title="Adapter for NextJS" icon="tabler:brand-nextjs" href="https://github.com/opral/monorepo/tree/main/inlang/source-code/paraglide/paraglide-js-adapter-next" description="Go to GitHub example"></doc-link>
    <doc-link title="Adapter for Vite" icon="tabler:brand-vite" href="https://github.com/opral/monorepo/tree/main/inlang/source-code/paraglide/paraglide-js-adapter-vite" description="Go to GitHub"></doc-link>
</doc-links>

#### Alternatively, [you can write your own adapter](#writing-an-adapter)

# Usage

Running your `build` script will generate a `src/paraglide` folder. This folder contains all the code that you need to use paraglide-js.
Throughout this guide, you will see imports from `./paraglide/*`. These are all to this folder.

> Tip: If you are using a bundler, you can set up an alias to `./src/paraglide` to make the imports shorter. We recommend `$paraglide/*`

## Using Messages

The compiled messages are placed in `./paraglide/messages.js`. You can import them all with `import * as m from "./paraglide/messages"`. Don't worry, your bundler will only bundle the messages that you actually use.

```js
// m is a namespace that contains all messages of your project
// a bundler like rollup or webpack only bundles
// the messages that are used
import * as m from "./paraglide/messages.js"
import { setLanguageTag } from "./paraglide/runtime.js"

// use a message
m.hello() // Hello world!

// message with parameters
m.loginHeader({ name: "Samuel" }) // Hello Samuel, please login to continue.

// change the language
setLanguageTag("de")

m.loginHeader({ name: "Samuel" }) // Hallo Samuel, bitte melde dich an, um fortzufahren.
```

If you want to dynamically choose between a set of messages, you can create a record of messages and index into it. Note that this will not be tree-shaken by your bundler.

```js
import * as m from "./paraglide/messages.js"

const season = {
	spring: m.spring,
	summer: m.summer,
	autumn: m.autumn,
	winter: m.winter,
}

const msg = season["spring"]() // Hello spring!
```

Paraglide JS provides several exports from `./paraglide/runtime.js`:

| Variable                    | Description                                                           |
| --------------------------- | --------------------------------------------------------------------- |
| `sourceLanguageTag`         | The source language tag of the project                                |
| `availableLanguageTags`     | All language tags of the current project                              |
| `type AvailableLanguageTag` | An Type representing a valid language tag                             |
| `languageTag()`             | Returns the language tag of the current user                          |
| `setLanguageTag()`          | Sets the language tag of the current user                             |
| `onSetLanguageTag()`        | Registers a listener that is called whenever the language tag changes |
| `isAvailableLanguageTag()`  |  Checks if a value is a valid language tag                            |

## Setting the language

You can set the current [language tag](https://www.inlang.com/m/8y8sxj09/library-inlang-languageTag) by calling `setLanguageTag()`. Any subsequent calls to either `languageTag()` or a message function will return the new language tag.

```js
import { setLanguageTag } from "./paraglide/runtime.js"
import * as m from "./paraglide/messages.js"

setLanguageTag("de")
m.hello() // Hallo Welt!

setLanguageTag("en")
m.hello() // Hello world!
```

The [language tag](https://www.inlang.com/m/8y8sxj09/library-inlang-languageTag) is global, so you need to be careful with it on the server to make sure multiple requests don't interfere with each other. That's why we recommend using an adapter for your framework. Adapters integrate with the framework's lifecycle and ensure that the language tag is managed correctly.

## Adding Languages

You can define which languages you want to support in `./project.inlang/settings.json`. Just edit the `languageTags` array.

```json
// project.inlang/settings.json
{
	"languageTags": ["en", "de"]
}
```

## Reacting to a language change

You can react to a language change by registering a callback using `onSetLanguageTag()`. This function is called whenever the [language tag](https://www.inlang.com/m/8y8sxj09/library-inlang-languageTag) changes.

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
- It shouldn't be used on the server.

The main use case for `onSetLanguageTag()` is to trigger a rerender of your app's UI when the language changes. Again, if you are using an adapter this is handled for you.

## Forcing a language

It's common that you need to force a message to be in a certain language, especially on the server and during tests. You can do this by passing an options object to the message function as a
second parameter.

```js
import * as m from "./paraglide/messages.js"
const msg = m.hello({ name: "Samuel" }, { languageTag: "de" }) // Hallo Samuel!
```

## Usage with a Bundler

We provide bundler plugins to make it easier to use Paraglide with a bundler. If you
are using one of these bundlers, we recommed using the corresponding plugin.

- [Rollup](https://github.com/opral/monorepo/tree/main/inlang/source-code/paraglide/paraglide-js-adapter-rollup)
- [Webpack](https://github.com/opral/monorepo/tree/main/inlang/source-code/paraglide/paraglide-js-adapter-webpack)
- [Vite](https://github.com/opral/monorepo/tree/main/inlang/source-code/paraglide/paraglide-js-adapter-vite)

These plugins make sure to rerun the `compile` script whenever you build your project. That way you don't need to modify your build script in `package.json`. If you are using a bundler with a dev-server, like Vite, the plugins also make sure to rerun the `compile` script whenever your messages change.

# Playground

You can find many examples for how to use paraglide on codesandbox, or in [our GitHub repository](https://github.com/opral/monorepo/tree/main/inlang/source-code/paraglide).

<doc-links>
    <doc-link title="Svelte + Paraglide JS" icon="lucide:codesandbox" href="https://stackblitz.com/~/github.com/LorisSigrist/paraglide-sveltekit-example" description="Play around with Svelte and Paraglide JS"></doc-link>
    <doc-link title="Astro + Paraglide JS" icon="lucide:codesandbox" href="https://stackblitz.com/~/github.com/LorisSigrist/paraglide-astro-example" description="Play around with Astro and Paraglide JS"></doc-link>
</doc-links>

# Architecture

Inlang Paraglide JS leverages a compiler to emit vanilla JavaScript functions.

The emitted functions are referred to as "message functions". By emitting message functions, inlang Paraglide JS eliminates a whole class of edge cases while also being simpler, faster, and more reliable than other i18n libraries. The compiled runtime contains less than 50 LOC (lines of code) and is less than 300 bytes minified & gzipped.

![paraglide JS architecture](https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/source-code/paraglide/paraglide-js/assets/architecture.svg)

Inlang Paraglide-JS consists of four main parts:

| Part         | Description                                                                                                                  |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| **Compiler** | Compiles messages into tree-shakable message functions                                                                       |
| **Messages** | The compiled tree-shakable message functions                                                                                 |
| **Runtime**  | A runtime that resolves the [language tag](https://www.inlang.com/m/8y8sxj09/library-inlang-languageTag) of the current user |
| **Adapter**  | (optional) An adapter that adjusts the runtime for different frameworks                                                   |

## Compiler

The compiler loads an inlang project and compiles the messages into tree-shakable and typesafe message functions.

#### Example

**Input**

```js
// messages/en.json
{
  "hello": "Hello {name}!",
  "loginButton": "Login"
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

/** ... */
export const loginButton = () => "Login"
```

## Messages

The compiled messages are importable as a namespace import (`import * as m`).

The namespace import ensures that bundlers like Rollup, Webpack, or Turbopack can tree-shake the messages that are not used.

#### Example

Three compiled message functions exist in an example project.

```js
// src/paraglide/messages.js

/** ... */
export const hello = (params) => `Hello ${params.name}!`

/** ... */
export const loginButton = () => "Login"

/** ... */
export const loginHeader = (params) => `Hello ${params.name}, please login to continue.`
```

Only the message `hello` is used in the source code.

```js
// src/my-code.js
import * as m from "../paraglide/messages.js"

console.log(m.hello({ name: "Samuel" }))
```

The bundler tree shakes (removes) `loginButton` and `loginHeader` and only includes `hello` in the output.

```js
// dist/my-code.js
const hello = (params) => `Hello ${params.name}!`

console.log(hello({ name: "Samuel" }))
```

# Writing an Adapter

Paraglide can be adapted to any framework or environment by calling `setLanguageTag()` and `onSetLanguageTag()`.

The following example adapts Paraglide-JS to a fictitious metaframework like NextJS, SolidStart, SvelteKit, or Nuxt.

The goal is to provide a high-level understanding of how to adapt Paraglide to a framework. Besides this example, we recommend viewing the source-code of available adapters. In general, only two functions need to be called to adapt Paraglide to a framework:

1.  `setLanguageTag()` can be used to set a getter function for the [language tag](https://www.inlang.com/m/8y8sxj09/library-inlang-languageTag). The getter function can be used to resolve server-side language tags or to resolve the language tag from a global state management library like Redux or Vuex.
2.  `onSetLanguageTag()` can be used to trigger side-effects such as updating the UI, or requesting the site in the new language from the server.

```tsx
import { setLanguageTag, onSetLanguageTag } from "../paraglide/runtime.js"
import { isServer, request, render } from "@example/framework"

// On a server, the language tag needs to be resolved on a
// per-request basis. Hence, we need to pass a getter
// function () => string to setLanguageTag.
//
// Most frameworks offer a way to access the current
// request. In this example, we assume that the language tag
// is available in the request object.
if (isServer) {
	setLanguageTag(() => request.languageTag)
}
// On a client, the language tag could be resolved from
// the document's html lang tag.
//
// In addition, we also want to trigger a side-effect
// to request the site if the language changes.
else {
	setLanguageTag(() => document.documentElement.lang)

	//! Make sure to call `onSetLanguageTag` after
	//! the initial language tag has been set to
	//! avoid an infinite loop.

	// route to the page in the new language
	onSetLanguageTag((newLanguageTag) => {
		window.location.pathname = `/${newLanguageTag}${window.location.pathname}`
	})
}

// render the app
render((page) => (
	<html lang={request.languageTag}>
		<body>{page}</body>
	</html>
))
```

# Community

We are grateful for all the support we get from the community. Here are just a few of the comments we've received over the last few weeks.
Of course we are open to and value criticism as well. If you have any feedback, please let us know directly on [GitHub](https://github.com/opral/monorepo/discussions/1464)

<doc-comments>
<doc-comment text="Just tried Paraglide JS from @inlangHQ. This is how i18n should be done! Totally new level of DX for both implementation and managing translations! Superb support for SvelteKit as well ⭐" author="Patrik Engborg" icon="mdi:twitter" data-source="https://twitter.com/patrikengborg/status/1747260930873053674"></doc-comment>
<doc-comment text="The lib is great guys!" author="ktarmyshov" icon="mdi:github"></doc-comment>
<doc-comment text="Thank you for that huge work you have done and still doing!" author="ZerdoX-x" icon="mdi:github"></doc-comment>
<doc-comment text="[...] the switch between the sdk-js and paraglide has been pretty great! " author="albbus" icon="mdi:discord"></doc-comment>
<doc-comment text="Thanks for all the great work @Samuel Stroschein" author="Willem" icon="mdi:discord"></doc-comment>
</doc-comments>

# Roadmap

Of course, we're not done yet! We plan on adding the following features to Paraglide JS in the upcoming weeks:

- [ ] Pluralization ([Join the Discussion](https://github.com/opral/monorepo/discussions/2025))
- [ ] Formatting of numbers and dates ([Join the Discussion](https://github.com/opral/monorepo/discussions/992))
- [ ] Markup Placeholders ([Join the Discussion](https://github.com/opral/monorepo/discussions/913))

# Talks

- [Svelte Summit Spring 2023](https://www.youtube.com/watch?v=Y6IbPfMU1xM)
- [Svelte Summit Fall 2023](https://www.youtube.com/watch?v=-YES3CCAG90)
- Web Zurich December 2023
- [Svelte London January 2024](https://www.youtube.com/watch?v=eswNQiq4T2w&t=646s)

# Working with Translators

Paraglide JS is part of the inlang ecosystem, so it integrates nicely with all the other inlang compatible tools. If you are working with translators and/or designers you will find the following tools useful:

- [Fink](https://inlang.com/m/tdozzpar/app-inlang-finkLocalizationEditor) - An Online UI for editing translations. Changes made in Fink are committed to a translation branch or submitted via pull request.
- [Parrot](https://inlang.com/m/gkrpgoir/app-parrot-figmaPlugin) - A Figma Plugin for previewing translations right in your Figma designs. This avoids any layout issues that might occur due to different text lengths in different languages.

# Pricing 

<doc-pricing></doc-pricing>
