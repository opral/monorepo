---
imports:
  - https://cdn.jsdelivr.net/npm/@opral/markdown-wc-doc-elements/dist/doc-callout.js
---

# Vanilla JavaScript/TypeScript Setup

This guide walks you through setting up Paraglide JS in a vanilla JavaScript or TypeScript project without any framework.

## Installation

First, initialize a Paraglide JS project. This will set up the necessary configuration and create example message files.

```bash
npx @inlang/paraglide-js@latest init
```

## Compiling your first messages

```bash
npx @inlang/paraglide-js compile --project ./project.inlang --outdir ./src/paraglide
```

This command generates TypeScript or JavaScript files in your `src/paraglide` directory, which you can then import into your application code.

## Using messages

```js
// Import your message functions
import { m } from "./src/paraglide/messages.js";
import { getLocale, setLocale } from "./src/paraglide/runtime.js";

// Use a message (with parameters if needed)
console.log(m.greeting({ name: "World" })); // "Hello World!"

// Change the locale
setLocale("de");

console.log(m.greeting({ name: "Welt" })); // "Hallo Welt!"

// Get the current locale
console.log(getLocale()); // "de"
```

## Next steps

1. Use a [bundler plugin](https://inlang.com/m/gerre34r/library-inlang-paraglideJs/compiling-messages#via-a-bundler-plugin) if applicable. 
2. Read the [basics documentation](/m/gerre34r/library-inlang-paraglideJs/basics) for more information on how to use Paraglide's messages, parameters, and locale management.