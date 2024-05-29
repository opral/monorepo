---
title: Architecture
description: "Paraglide isn't like other i18n libraries. It uses a compiler to generate translations. Learn more about it here."
---

# Architecture

Paraglide uses a compiler to generate JS functions from your messages. We call these "message functions". 

Message Functions are fully typed using JSDoc. They are exported individually from the `messages.js` file making them tree-shakable. When called, they return a translated string. Message functions aren't reactive in any way, if you want a translation in another language you will need to re-call them.

This design avoids many edge cases with reactivity, lazy-loading, and namespacing that other i18n libraries have to work around.

In addition to the message functions, ParaglideJS also emits a runtime. The runtime is used to set the language tag. It contains less than 50 LOC (lines of code) and is less than 300 bytes minified & gzipped.

![Diagram of the Paraglide Compiler Architecture](https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/source-code/paraglide/paraglide-js/assets/architecture.svg)

Paraglide consists of four main parts:

| Part         | Description                                                                                                                  |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| **Compiler** | Compiles messages into tree-shakable message functions                                                                       |
| **Messages** | The compiled tree-shakable message functions                                                                                 |
| **Runtime**  | A runtime that resolves the [language tag](https://www.inlang.com/m/8y8sxj09/library-inlang-languageTag) of the current user |
| **Framework Library**  | (optional) A framework library that adjusts the runtime for different frameworks                                                      |

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
