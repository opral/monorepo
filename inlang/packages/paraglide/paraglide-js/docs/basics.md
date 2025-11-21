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
  These examples use the inlang message format plugin that ships by default, but Paraglide works with any format plugin that produces the expected message files. Swap the plugin in `project.inlang/settings.json` if you prefer a different storage format—see the <a href="https://inlang.com/c/plugins">plugin directory</a>.
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

### Disabling reloading

By default, `setLocale()` triggers a full page reload. This is a deliberate design decision that:

- Enables a small, efficient runtime without complex state management
- Makes Paraglide work in any framework without requiring framework-specific adapters
- Follows the pattern used by major websites like YouTube, as language switching is an infrequent action that doesn't justify the complexity of a no-reload approach

If you need to change the locale without a page reload, you can pass `{ reload: false }` as the second parameter, but then you'll need to handle UI updates yourself.

```js
// Change locale without reloading the page
setLocale("de", { reload: false });
```

## Getting the current locale

To get the current locale, use the `getLocale` function:

```js
import { getLocale } from "./paraglide/runtime.js";

console.log(getLocale()); // "de"
```

## Routing
<doc-callout type="info"> Automatic `<a>` tag localization has been removed in v2. See [changelog](/m/gerre34r/library-inlang-paraglideJs/changelog#localizehref-is-now-required) and this [issue](https://github.com/opral/inlang-paraglide-js/issues/485) for more information.
</doc-callout>

You must explicitly use localizeHref() for URL localization:

```tsx
<a href={localizeHref("/blog")}>Blog</a>
```

Important: If you route to a different locale, ensure a reload happens afterwards. See https://inlang.com/m/gerre34r/library-inlang-paraglideJs/errors#switching-locales-via-links-doesnt-work

## Choosing your strategy

You likely want to use one of the built-in strategies. Visit the [strategy documentation](./strategy.md) to learn more.

## Message keys and organization

Paraglide supports nested keys through bracket notation but recommends flat keys due to management complexity. Learn more about [message key structures and best practices](/m/gerre34r/library-inlang-paraglideJs/message-keys).

```json
// messages/en.json
{
  // Recommended: flat keys with snake_case
  "user_profile_title": "User Profile",
  
  // Also supported but not recommended: nested keys
  "user": {
    "profile": {
      "title": "User Profile"
    }
  }
}
```

```js
import { m } from "./paraglide/messages.js";

console.log(m.user_profile_title()); // "User Profile" (recommended)
console.log(m["user.profile.title"]()); // "User Profile" (also works)
```


## Dynamically calling messages

You can dynamically call messages by specifying what messages you expect beforehand. Specifying the messages beforehand preserves tree-shaking.

```ts
import { m } from "./paraglide/messages.js";

const messages = {
	greeting: m.greeting,
	goodbye: m.goodbye,
};

let messageKey = "greeting";

console.log(messages[messageKey]());
// "Hello World!"
```

## Advanced usage

- [Choosing your strategy](/m/gerre34r/library-inlang-paraglideJs/strategy)
- [Server-side rendering](/m/gerre34r/library-inlang-paraglideJs/server-side-rendering)
- [Multi-tenancy](/m/gerre34r/library-inlang-paraglideJs/multi-tenancy)
