<!-- ![Paraglide JS header image](https://cdn.jsdelivr.net/gh/inlang/monorepo@latest/inlang/source-code/paraglide/paraglide-js/assets/paraglide-js-header.png) -->

[<img src="https://cdn.loom.com/sessions/thumbnails/a8365ec4fa2c4f6bbbf4370cf22dd7f6-with-play.gif" width="100%" /> Watch the pre-release demo of Paraglide JS](https://www.youtube.com/watch?v=-YES3CCAG90)

Attention: The following features are missing and will be added in the upcoming weeks:

- [ ] Support for pluralization

# The i18n library that you can set up within 3 lines of code

Type in the following command into your terminal to get started immediately:

```bash
npx @inlang/paraglide-js@latest init
```

# Features

<doc-features>
  <doc-feature title="No unused translations" image="https://cdn.jsdelivr.net/gh/inlang/monorepo@latest/inlang/source-code/paraglide/paraglide-js/assets/unused-translations.png"></doc-feature>
  <doc-feature title="Reduced payload" image="https://cdn.jsdelivr.net/gh/inlang/monorepo@latest/inlang/source-code/paraglide/paraglide-js/assets/reduced-payload.png"></doc-feature>
  <doc-feature title="Typesafety" image="https://cdn.jsdelivr.net/gh/inlang/monorepo@latest/inlang/source-code/paraglide/paraglide-js/assets/typesafe.png"></doc-feature>
</doc-features>

### Treeshaking

<doc-figure src="https://cdn.jsdelivr.net/gh/inlang/monorepo@latest/inlang/source-code/paraglide/paraglide-js/assets/tree-shaking.jpg" alt="An illustration explaining the benefits of treeshaking in software" caption="How Paraglide JS treeshaking works">
</doc-figure>

Treeshaking gives us superpowers. With it, each page of your app only loads the messages that it actually uses. Incremental loading like this would usually take hours of manual tweaking to get right. With Paraglide-JS you get it for free. Say goodbye to huge bundles.


# Getting started

### 1. Initialize paraglide-js

You can initialize paraglide-js by running the following command in your terminal:

```bash
npx @inlang/paraglide-js@latest init
```

### 2. Select an adapter (if required)

Having an adapter is only required if you want to use paraglide-js with a framework. If you don't use a framework, you can skip this step.

<doc-links>
    <doc-link title="Adapter for Svelte" icon="simple-icons:svelte" href="https://github.com/inlang/monorepo/tree/main/inlang/source-code/paraglide/paraglide-js-adapter-svelte/example" description="Go to GitHub example"></doc-link>
    <doc-link title="Adapter for SolidJS" icon="tabler:brand-solidjs" href="https://discord.com/channels/897438559458430986/1163823207128776795" description="View progress"></doc-link>
    <doc-link title="Adapter for NextJS" icon="tabler:brand-nextjs" href="https://github.com/inlang/monorepo/tree/main/inlang/source-code/paraglide/paraglide-js-adapter-next" description="Go to GitHub example"></doc-link>
    <doc-link title="Adapter for Vite" icon="tabler:brand-vite" href="https://github.com/inlang/monorepo/tree/main/inlang/source-code/paraglide/paraglide-js-adapter-vite" description="Go to GitHub"></doc-link>
</doc-links>

#### Alternatively, [you can write your own adapter](#writing-an-adapter)

### 3. Add the `compile` script to your `package.json`

> If you are using `@inlang/paraglide-js-adapter-vite`, you can skip this step.

You can customize the `compile` script to your needs. For example, you can add a `--watch` flag to watch for changes, if you have installed a watcher.

```json
{
	"scripts": {
		"compile": "paraglide-js compile"
	}
}
```

# Usage

Running the `compile` script will generate a `src/paraglide` folder. This folder contains all the code that you need to use paraglide-js.
Throughout this guide, you will see imports from `./paraglide/*`. These are all to this folder.

> Tip: If you are using a bundler, you can set up an alias to `./src/paraglide` to make the imports shorter. We recommend `$paraglide/*`

## Using Messages

The compiled messages are placed in `./paraglide/messages.js`. You can import them all with `import * as m from "./paraglide/messages"`. Don't worry, your bundler will only bundle the messages that you actually use.

```js
// m is a namespace that contains all messages of your project
// a bundler like rollup or webpack only bundles
// the messages that are used
import * as m from "./paraglide/messages"
import { setLanguageTag } from "./paraglide/runtime"

// use a message
m.hello() // Hello world!

// message with parameters
m.loginHeader({ name: "Samuel" }) // Hello Samuel, please login to continue.

// change the language
setLanguageTag("de")

m.loginHeader({ name: "Samuel" }) // Hallo Samuel, bitte melde dich an, um fortzufahren.
```

Paraglide JS provides five exports in `./paraglide/runtime.js`:

| Variable                | Description                                                           |
| ----------------------- | --------------------------------------------------------------------- |
| `sourceLanguageTag`     | The source language tag of the project                                |
| `availableLanguageTags` | All language tags of the current project                              |
| `languageTag()`         | Returns the language tag of the current user                          |
| `setLanguageTag()`      | Sets the language tag of the current user                             |
| `onSetLanguageTag()`    | Registers a listener that is called whenever the language tag changes |

## Setting the language

You can set the current language tag by calling `setLanguageTag()`. Any subsequent calls to either `languageTag()` or a message function will return the new language tag.

```js
import { setLanguageTag } from "./paraglide/runtime"
import * as m from "./paraglide/messages"

setLanguageTag("de")
m.hello() // Hallo Welt!

setLanguageTag("en")
m.hello() // Hello world!
```

The language tag is global, so you need to be careful with it on the server to make sure multiple requests don't interfere with each other. That's why we recommend using an adapter for your framework. Adapters integrate with the framework's lifecycle and ensure that the language tag is managed correctly.

## Reacting to a language change

You can react to a language change by calling `onSetLanguageTag()`. This function is called whenever the language tag changes.

```js
import { setLanguageTag, onSetLanguageTag } from "./paraglide/runtime"
import * as m from "./paraglide/messages"

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

It's common that you need to force a message to be in a certain language, especially on the server. You can do this by passing an options object to the message function as a
second parameter.

```js
import * as m from "./paraglide/messages"
const msg = m.hello({ name: "Samuel" }, { languageTag: "de" }) // Hallo Samuel!
```

## Usage with a Bundler

We provide a few bundler plugins to make it easier to use paraglide-js with a bundler. If you
are using one of these bundlers, we recommed using the corresponding plugin.

- [Rollup](https://github.com/inlang/monorepo/tree/main/inlang/source-code/paraglide/paraglide-js-adapter-rollup)
- [Webpack](https://github.com/inlang/monorepo/tree/main/inlang/source-code/paraglide/paraglide-js-adapter-webpack)
- [Vite](https://github.com/inlang/monorepo/tree/main/inlang/source-code/paraglide/paraglide-js-adapter-vite)

These plugins make sure to rerun the `compile` script whenever you build your project. That way you don't need to modify your build script in `package.json`. If you are using a bundler with a dev-server, like Vite, the plugins also make sure to rerun the `compile` script whenever your messages change.

# Playground

You can find many examples for how to use paraglide on codesandbox:

<doc-links>
    <doc-link title="Svelte + Paraglide JS" icon="lucide:codesandbox" href="https://dub.sh/paraglide-playground-svelte" description="Play around with Svelte and Paraglide JS"></doc-link>
</doc-links>

# Architecture

Inlang Paraglide JS leverages a compiler to emit vanilla JavaScript functions.

The emitted functions are often referred to as "message functions". By emitting message functions, inlang Paraglide JS eliminates a class of edge cases while also being simpler, faster, and more reliable than other i18n libraries. The compiled runtime contains less than 50 LOC (lines of code) and is less than 1kb gzipped.

![paraglide JS architecture](https://cdn.jsdelivr.net/gh/inlang/monorepo@latest/inlang/source-code/paraglide/paraglide-js/assets/architecture.svg)

Inlang Paraglide-JS consists of four main parts:

| Part         | Description                                                                |
| ------------ | -------------------------------------------------------------------------- |
| **Compiler** | Compiles messages into tree-shakable message functions                     |
| **Messages** | The compiled tree-shakable message functions                               |
| **Runtime**  | A runtime that resolves the language tag of the current user               |
| **Adapter**  | (if required) An adapter that adjusts the runtime for different frameworks |

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
// src/paraglide/messages.js

/**
 * @param {object} params
 * @param {string} params.name
 */
function hello({ name }) {
	return `Hello ${name}!`
}

function loginButton() {
	return "Login"
}
```

## Messages

The compiled messages are importable as a namespace import (`import * as m`).

The namespace import ensures that bundlers like Rollup, Webpack, or Turbopack can tree-shake the messages that are not used.

#### Example

Three compiled message functions exist in an example project.

```js
// src/paraglide/messages.js

export function hello(params) {
	return `Hello ${params.name}!`
}

export function loginButton() {
	return "Login"
}

export function loginHeader(params) {
	return `Hello ${params.name}, please login to continue.`
}
```

Only the message `hello` is used in the source code.

```js
// source/index.js

import * as m from "./paraglide/messages"

console.log(m.hello({ name: "Samuel" }))
```

The bundler tree shakes (removes) `loginButton` and `loginHeader` and only includes `hello` in the output.

```js
// output/index.js

function hello(params) {
	return `Hello ${params.name}!`
}

console.log(hello({ name: "Samuel" }))
```

## Runtime

View the source of `./paraglide/runtime.js` to find the latest runtime API and documentation.

## Adapter

Paraglide-JS can be adapted to any framework or environment by calling `setLanguageTag()` and `onSetLanguageTag()`.

1.  `setLanguageTag()` can be used to set a getter function for the language tag. The getter function can be used to resolve server-side language tags or to resolve the language tag from a global state management library like Redux or Vuex.
2.  `onSetLanguageTag()` can be used to trigger side-effects such as updating the UI, or requesting the site in the new language from the server.

# Writing an Adapter

The following example adapts Paraglide-JS to a fictitious metaframework like NextJS, SolidStart, SvelteKit, or Nuxt.

The goal is to provide a high-level understanding of how to adapt Paraglide-JS to a framework. Besides this example, we recommend viewing the source-code of available adapters. In general, only two functions need to be called to adapt Paraglide-JS to a framework:

1. `setLanguageTag()`: to set the language tag
2. `onSetLanguageTag()`: to trigger a side-effect when the language changes

```tsx
import { setLanguageTag, onSetLanguageTag } from "./paraglide/runtime"
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
Of course we are open to and value criticism as well. If you have any feedback, please let us know directly on [GitHub](https://github.com/inlang/monorepo/discussions/1464)

<doc-comments>
<doc-comment text="The lib is great guys!" author="ktarmyshov" icon="mdi:github"></doc-comment>
<doc-comment text="Thank you for that huge work you have done and still doing!" author="ZerdoX-x" icon="mdi:github"></doc-comment>
<doc-comment text="[...] the switch between the sdk-js and paraglide has been pretty great! " author="albbus" icon="mdi:discord"></doc-comment>
<doc-comment text="Thanks for all the great work @Samuel Stroschein" author="Willem" icon="mdi:discord"></doc-comment>
</doc-comments>
