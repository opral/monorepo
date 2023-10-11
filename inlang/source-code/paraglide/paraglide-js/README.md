# @inlang/paraglide-js

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


1. Add paraglide as a dependency:

```bash
npm install @inlang/paraglide-js
```

2. Add the compiler to your build script:

```diff
{
  "scripts": {
+    "build": "paraglide-js compile"
  }
}
```

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
// @inlang/paraglide-js/messages


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

import * as m from "@paraglide-js/messages"

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

The runtime provides 

```ts
languageTag: string
setLanguageTag: (languageTag: string) => void
```

- `setLanguageTag()`
- `onSetLanguageTag()`


### `setLanguageTag()`

Message functions 

## ADAPTER 

The compiler emits a runtime that is adaptable to any use-case by calling `setLanguageTag()` and `onSetLanguageTag()`.