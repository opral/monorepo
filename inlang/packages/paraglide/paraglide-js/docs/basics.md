---
imports: 
  - https://cdn.jsdelivr.net/npm/@opral/markdown-wc-doc-elements/dist/doc-callout.js
---

# Basics

## Adding and removing locales 

To add a new locale, add it to the `locales` array in `<project0name>.inlang/settings.json` file.

```diff
// project.inlang/settings.json

{
  "baseLocale": "en",
+ "locales": ["en", "de"]
}
```

## Adding and editing messages

<doc-callout type="info">
  This section assumes you use the inlang message format plugin that is setup by default in Paraglide JS. 
</doc-callout>

Messages are stored in `messages/{locale}.json` as key-value pairs. You can add parameters with curly braces.

```diff
// messages/en.json
{
+ 	"greeting": "Hello {name}!"
}
```

## Importing messages

After compiling your project, you'll have access to all your messages through the generated `messages.js` file:

```js
// Import all messages at once
import { m } from "./paraglide/messages.js";

// Use a message
console.log(m.hello_world()); // "Hello World!"
```

## Using parameters 

For messages with parameters, simply pass an object with the parameter values:

```js
// messages/en.json
// { "greeting": "Hello {name}!" }

import { m } from "./paraglide/messages.js";

// Pass parameters as an object
console.log(m.greeting({ name: "Samuel" })); // "Hello Samuel!"
```

## Forcing a locale

You can override the locale by passing a locale option as the second parameter:

<doc-callout type="tip">
  This is particularly useful in server-side contexts where you might need to render content in multiple languages regardless of the user's current locale.
</doc-callout>

```js
import { m } from "./paraglide/messages.js";

// Force the message to be in German
console.log(m.greeting({ name: "Samuel" }, { locale: "de" })); // "Hallo Samuel!"
```

## Setting the locale

To change the current locale, use the `setLocale` function:

```js
import { setLocale } from "./paraglide/runtime.js";

// Change locale to German
setLocale("de");
```

## Getting the current locale

To get the current locale, use the `getLocale` function:

```js
import { getLocale } from "./paraglide/runtime.js";

console.log(getLocale()); // "de"
```

## Routing

The `localizeHref` function can be used to generate URLs with the current locale:

```js
import { localizeHref } from "./paraglide/runtime.js";

console.log(localizeHref("/blog")); // "/blog"
console.log(localizeHref("/blog", { locale: "de" })); // "/de/blog"
```

```tsx
<a href={localizeHref("/blog")}>Blog</a>
<a href={localizeHref("/blog", { locale: "de" })}>Blog (de)</a>
```

## Choosing your strategy

You likely want to use one of the built-in strategies. Visit the [strategy documentation](./strategy.md) to learn more.

## Dynamically calling messages

You can dynamically call messages by specifying what messages you expect beforehand. Specifying the messages beforehand preserves tree-shaking. 

```ts
import { m } from "./paraglide/messages.js";

const messages = {
  greeting: m.greeting,
  goodbye: m.goodbye
}

let messageKey = "greeting";

console.log(messages[messageKey]()); 
// "Hello World!"
```


## Advanced usage 

- [Choosing your strategy](/m/gerre34r/library-inlang-paraglideJs/strategy)
- [Server-side rendering](/m/gerre34r/library-inlang-paraglideJs/server-side-rendering)
- [Multi-tenancy](/m/gerre34r/library-inlang-paraglideJs/multi-tenancy)
