[<img src="https://cdn.loom.com/sessions/thumbnails/a8365ec4fa2c4f6bbbf4370cf22dd7f6-with-play.gif" width="100%" /> Watch the demo of Paraglide JS](https://www.youtube.com/watch?v=-YES3CCAG90)

<!-- ![Paraglide JS header image](https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/source-code/paraglide/paraglide-js/assets/paraglide-js-header.png) -->

# Simple, adaptable, and tiny i18n library for JS

Get started with:

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

Initialize paraglide-js whith:

```bash
npx @inlang/paraglide-js@latest init
```

This will:

1. Install necessary dependencies
2. Add the Paraglide compiler to your `build` script
3. Set up configuration files

### 2. Set up an adapter (optional)

Adapters are framework-integrations for Paraglide. If you are using a framework, using an adapter is recommended , but not required.

<doc-links>
	<doc-link title="Adapter for NextJS" icon="tabler:brand-nextjs" href="https://inlang.com/m/osslbuzt/library-inlang-paraglideJsAdapterNextJs" description="Go to Library"></doc-link>
    <doc-link title="Adapter for SvelteKit" icon="simple-icons:svelte" href="https://inlang.com/m/dxnzrydw/library-inlang-paraglideJsAdapterSvelteKit" description="Go to Library"></doc-link>
    <doc-link title="Adapter for SolidJS" icon="tabler:brand-solidjs" href="https://inlang.com/m/n860p17j/library-inlang-paraglideJsAdapterSolidStart" description="Go to Library"></doc-link>
    <doc-link title="Adapter for Vite" icon="tabler:brand-vite" href="https://github.com/opral/monorepo/tree/main/inlang/source-code/paraglide/paraglide-js-adapter-vite" description="Go to GitHub"></doc-link>
</doc-links>

#### Alternatively, [you can write your own adapter](#writing-an-adapter)

# Usage

Running your `build` script will generate a `src/paraglide` folder. This folder contains all the code that you need to use paraglide-js.

> Tip: If you are using a bundler, you can set up an alias to `./src/paraglide` to make the imports shorter.

## Adding Messages

By default, paraglide expects your messages to be in `messages/{lang}.json`. 
```json
{
	"hello": "Hello world!"
	"loginHeader": "Hello {name}, please login to continue."
}
```

## Using Messages

You can import messages with `import * as m from "./paraglide/messages"`. Don't worry, your bundler will only include the messages that you actually use.

```js
import * as m from "./paraglide/messages.js"
import { setLanguageTag } from "./paraglide/runtime.js"

m.hello() // Hello world!
m.loginHeader({ name: "Samuel" }) // Hello Samuel, please login to continue.
```

If you want to choose between messages at runtime, you can create a record of messages and index into it.

```ts
import * as m from "./paraglide/messages.js"

const season = {
	spring: m.spring,
	summer: m.summer,
	autumn: m.autumn,
	winter: m.winter,
} as const;

const msg = season["spring"]() // Hello spring!
```


### (optional) Using the [Sherlock](https://inlang.com/m/r7kp499g/app-inlang-ideExtension) IDE Extension

[Sherlock](https://inlang.com/m/r7kp499g/app-inlang-ideExtension) integrates with paraglide to give you the optimal dev-experience. 

![VsCode screenshot showing Sherlock adding inlay hints next to messages and making an "extract message" code action available for hardcoded text](https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/source-code/paraglide/paraglide-js/assets/sherlock-preview.png)

## Adding Languages

You can declare which languages you support in `./project.inlang/settings.json` in the `languageTags` array.

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

You can import a message in a specific language from `paraglide/messages/{lang}.js`. This is great if you always need the same language in a given file. 

```ts
import * as m from "./paraglide/messages/de.js"
m.hello() // Hallo Welt
```

If you want to force a language, but don't know ahead of time _which_ language you can pass the `languageTag` option as the second parameter to a message function. This is often needed on the server.

```js
import * as m from "./paraglide/messages.js"
const msg = m.hello({ name: "Samuel" }, { languageTag: "de" }) // Hallo Samuel!
```

## Lazy-Loading

Paraglide consciously discourages lazy-loading translations since it seriously hurts
your web-vitals. Learn more about why lazy-loading is bad & what to do instead in [this blog post](https://inlang.com/g/mqlyfa7l/guide-lorissigrist-dontlazyload).

If you _really_ want to do it anway, you can lazily import the language-specific message files. Be careful with this, as it's easy to accidenally break tree-shaking.

```ts
const lazyGerman = await import("./paraglide/messages/de.js")
```

## Usage with a Bundler

We provide bundler plugins to make it easier to use Paraglide with a bundler. If you
are using one we recommed using the corresponding plugin.

- [Rollup](https://github.com/opral/monorepo/tree/main/inlang/source-code/paraglide/paraglide-js-adapter-rollup)
- [Webpack](https://github.com/opral/monorepo/tree/main/inlang/source-code/paraglide/paraglide-js-adapter-webpack)
- [Vite](https://github.com/opral/monorepo/tree/main/inlang/source-code/paraglide/paraglide-js-adapter-vite)

These plugins make sure to compile your messages whenever you build your project. If your bundler has a dev-server, like Vite, the plugin also makes sure to recompile whenever your messages change.

# Playground

You can find many examples for how to use paraglide on codesandbox, or in [our GitHub repository](https://github.com/opral/monorepo/tree/main/inlang/source-code/paraglide).

<doc-links>
    <doc-link title="NextJS + Paraglide JS" icon="lucide:codesandbox" href="https://stackblitz.com/~/LorisSigrist/paraglide-next-app-router-example" description="Play around with NextJS and Paraglide JS"></doc-link>
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
| **Adapter**  | (optional) An adapter that adjusts the runtime for different frameworks                                                      |

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

An "adapter" is a library that integrates with a framework's liefcycle and does two main things:

- Calls `setLanguageTag()` at appropriate times to set the language
- Reacts to `onSetLanguageTag()`, usually by navigating or relading the page.

Here is an example that adapts Paraglide-JS to a fictitious metaframework like NextJS or SvelteKit.

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

// make sure the app renders _after_ you've done your setup
render((page) => (
	<html lang={request.languageTag}>
		<body>{page}</body>
	</html>
))
```

# Community

We are grateful for all the support we get from the community. Here are a few comments we've received recently. 

If you have any feedback / problems, please let us know on [GitHub](https://github.com/opral/inlang-paraglide-js/issues/new)

<doc-comments>
<doc-comment text="Just tried Paraglide JS from @inlangHQ. This is how i18n should be done! Totally new level of DX for both implementation and managing translations! Superb support for SvelteKit as well ⭐" author="Patrik Engborg" icon="mdi:twitter" data-source="https://twitter.com/patrikengborg/status/1747260930873053674"></doc-comment>
<doc-comment text="The lib is great guys!" author="ktarmyshov" icon="mdi:github"></doc-comment>
<doc-comment text="Thank you for that huge work you have done and still doing!" author="ZerdoX-x" icon="mdi:github"></doc-comment>
<doc-comment text="[...] the switch between the sdk-js and paraglide has been pretty great! " author="albbus" icon="mdi:discord"></doc-comment>
<doc-comment text="Thanks for all the great work @Samuel Stroschein" author="Willem" icon="mdi:discord"></doc-comment>
</doc-comments>

# Roadmap

Of course, we're not done yet! We plan on adding the following features to Paraglide JS soon:

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
