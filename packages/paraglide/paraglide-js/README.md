# @inlang/paraglide-js

<doc-gallery>TODO: adapter gallery</doc-gallery>

- [x] small, fast, and typesafe (less than 1kb gzipped)
- [x] only bundles the messages that are used (tree-shaking)
- [x] plug & play with the [inlang ecosystem](https://inlang.com/marketplace)





# Usage

Messages are imported as a namespace and can be used as follows:

```js
// m is a namespace that contains all messages of your project
// a bundler like rollup or webpack will only bundle the messages that are used
import * as m from "@inlang/paraglide-js/messages"
import { setLanguageTag } from "@inlang/paraglide-js"

// use a message
m.hello() // Hello world!

// message with parameters
m.loginHeader({ name: "Samuel" }) // Hello Samuel, please login to continue.

// change the language
setLanguageTag("de")
m.loginHeader({ name: "Samuel" }) // Hallo Samuel, bitte logge dich ein um fortzufahren.

```

Paraglide JS exports four runtime variables and functions via "@inlang/paraglide-js":

- `sourceLanguageTag`: the source language tag of the project
- `languageTags`: all language tags of the current project
- `languageTag()`: returns the language tag of the current user
- `setLanguageTag()`: sets the language tag of the current user


# Getting started

0. Ensure that you have a working inlang project. If you don't, follow the [getting started guide](https://inlang.com/documentation/getting-started).


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

By leveraging a compiler, inlang Paraglide JS eliminates a class of edge cases while also being simpler, faster, and more reliable than other i18n libraries. The compiler emits:

1. Tree-shakable message functions that are only bundled if they are used
2. Adaptable runtime (works for node, browser, react, vue, svelte, etc.)


## 1. Tree-shakable message functions (`m.function()`)

The compiler compiles messages (translations) into tree-shakable "message functions". The bundler (rollup, webpack, turbopack, etc.) automatically tree-shakes (removes) the message functions that are not used.

_Input_

```js
// the namespace import `* as m` is tree-shakable
import * as m from "@paraglide-js/messages"

console.log(m.hello({ username: "Samuel" }))
```

_Output_

```js
function hello({ username }) {
  return `Hello ${username}!`
}

console.log(hello({ username: "Samuel"}))
```


## 2. Adaptable runtime

The compiler emits a runtime that is adaptable to any use-case by calling `setLanguageTag()` and `onSetLanguageTag()`.

### `setLanguageTag()`

Message functions 