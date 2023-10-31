# @inlang/paraglide-js

<!-- ## ATTENTION: Paraglide is in pre-release mode. Discuss the API at https://github.com/inlang/monorepo/discussions/1464 -->
<doc-links>
    <doc-link title="ATTENTION: Paraglide is in pre-release mode." icon="mdi:github" href="https://github.com/inlang/monorepo/discussions/1464" description="Discuss the API on GitHub."></doc-link>
</doc-links>

<doc-gallery>TODO: adapter gallery</doc-gallery>

- [x] the smallest, fastest, and most typesafe i18n library
- [x] only bundles the messages that are used (tree-shaking)
- [x] storage agnostic (JSON, YAML, CSV, etc.) 
- [x] plug & play with the [inlang ecosystem](https://inlang.com/marketplace)

# Usage

Messages are imported as a namespace and can be used as follows:

```js
// m is a namespace that contains all messages of your project
// a bundler like rollup or webpack only bundles
// the messages that are used
import * as m from "@inlang/paraglide-js/messages"
import { setLanguageTag } from "@inlang/paraglide-js"

// use a message
m.hello() // Hello world!

// message with parameters
m.loginHeader({ name: "Samuel" }) // Hello Samuel, please login to continue.

// change the language
setLanguageTag("de")

m.loginHeader({ name: "Samuel" }) // Hallo Samuel, bitte melde dich an, um fortzufahren.

```

Paraglide JS exports four runtime variables and functions via "@inlang/paraglide-js":

- `sourceLanguageTag`: the source language tag of the project
- `languageTags`: all language tags of the current project
- `languageTag()`: returns the language tag of the current user
- `setLanguageTag()`: sets the language tag of the current user


# Getting started

## Available Adapters

- TODO: add adapters 

## Standalone

1. Add paraglide as a dependency:

```bash
npm install @inlang/paraglide-js
```

2. Add the compiler to your build script:

```diff
{
  "scripts": {
+    "build": "paraglide-js compile --namespace <namespace>"
  }
}
```

| compile | [options]   |          |                                  |
|---------|-------------|----------|----------------------------------|
|         | --project   | \<path\> | default: "./project.inlang.json" |
|         | --namespace | \<name\> | required                         |


# Architecture 

Inlang Paraglide JS leverages a compiler to emit a use-case optimized i18n library. 

By leveraging a compiler, inlang Paraglide JS eliminates a class of edge cases while also being simpler, faster, and more reliable than other i18n libraries. The compiled runtime contains less than 50 LOC (lines of code) and is less than 1kb gzipped.

Inlang Paraglide-JS consists of four main parts: 

- `COMPILER`: compiles messages into tree-shakable message functions
- `MESSAGES`: the compiled tree-shakable message functions
- `RUNTIME`: a runtime that resolves the language tag of the current user
- `ADAPTER`: (if required) an adapter that adjust the runtime for different frameworks

<img src="./assets/architecture.svg">


## COMPILER

The compiler loads an inlang project and compiles the messages into tree-shakable and type safe message functions.

### Example

#### Input

```js
// messages/en.json

hello: "Hello {name}!"

loginButton: "Login"
```

#### Output

```js
// @inlang/paraglide-js/messages

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


## MESSAGES

The compiled messages are importable as a namespace import (`import * as m`). 

The namespace import ensures that bundlers like Rollup, Webpack, or Turbopack can tree-shake the messages that are not used.

### Example

Three compiled message functions exists in an examplary project.

```js
// @inlang/paraglide-js/<namespace>/messages


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

import * as m from "@inlang/paraglide-js/<namespace>/messages"

console.log(m.hello({ name: "Samuel" }))
```

The bundler tree-shakes (removes) `loginButton` and `loginHeader` and only includes `hello` in the output.

```js
// output/index.js

function hello(params) {
  return `Hello ${params.name}!`
}

console.log(hello({ name: "Samuel"}))
```


## RUNTIME

View the source of your imports from `@inlang/paraglide-js/<namespace>` to find the latest runtime API and documentation. 

## ADAPTER 



Paraglide-JS can be adapted to any framework or environment by calling `setLanguageTag()` and `onSetLanguageTag()`. 

1.  `setLanguageTag()` can be used to set a getter function for the language tag. The getter function can be used to resolve server side language tags or to resolve the language tag from a global state management library like Redux or Vuex.
2.  `onSetLanguageTag()` can be used to trigger side-effects such as updating the UI, or request the site in the new language from the server.


### Writing an Adapter

The following example adapts Paraglide-JS to a fictious metaframework like NextJS, SolidStart, SvelteKit, or Nuxt. 

The goal is to provide a high-level understanding of how to adapt Paraglide-JS to a framework. Besides this example, we recommend to view the source-code of available adapters. In general, only two functions need to be called to adapt Paraglide-JS to a framework:

1. `setLanguageTag()`: to set the language tag
2. `onSetLanguageTag()`: to trigger a side-effect when the language changes




```tsx
import { setLanguageTag, onSetLanguageTag } from "@inlang/paraglide-js/<namespace>"
import { isServer, request, render } from "@example/framework"


// On a server, the language tag needs to be resolved on a 
// per-request basis. Hence, we need to pass a getter 
// function () => string to setLanguageTag.
// 
// Most frameworks offer a way to access the current
// request. In this example, we assume that the language tag
// is available in the request object.
if (isServer){
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
render((page) => 
  <html lang={request.languageTag}>
    <body>
      {page}
    </body>
  </html>
)
```

