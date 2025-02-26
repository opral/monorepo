---
imports: 
  - https://cdn.jsdelivr.net/npm/@opral/markdown-wc-doc-elements/dist/doc-link.js
  - https://cdn.jsdelivr.net/npm/@opral/markdown-wc-doc-elements/dist/doc-links.js
  - https://cdn.jsdelivr.net/npm/@opral/markdown-wc-doc-elements/dist/doc-callout.js
---

# Usage

<doc-callout type="tip">
  Paraglide is built with the inlang SDK, and therefore, supports many different translation file formats. By default, the [Inlang Message Format](https://inlang.com/m/reootnfj/plugin-inlang-messageFormat) is used.
</doc-callout>

## Working with the Inlang Message Format

It expects messages to be in `messages/{locale}.json` relative to your repo root.

```json
//messages/en.json
{
	"hello_world: "Hello World!",
	"greeting": "Hello {name}!"
}
```

The `messages/{locale}.json` file contains a flat map of message IDs and their translations. You can use curly braces to insert `{parameters}` into translations

**Nesting purposely isn't supported in the inlang message format (but other plugins do support it!)**. Nested messages are way harder to interact with from complementary tools like the [Sherlock IDE Extension](https://inlang.com/m/r7kp499g/app-inlang-ideExtension), the [Parrot Figma Plugin](https://inlang.com/m/gkrpgoir/app-parrot-figmaPlugin), or the [Fink Localization editor](https://inlang.com/m/tdozzpar/app-inlang-finkLocalizationEditor). Intellisense also becomes less helpful since it only shows the messages at the current level, not all messages. Additionally enforcing an organization-style side-steps organization discussions with other contributors.

## Using messages in Code

### Complex Formatting

The Message Format is still quite young, so advanced formats like plurals, formatting functions, and markup interpolation are currently not supported but are all planned

You can still achieve complex formatting like so:

For a message with multiple cases, aka a _select message_, you can define a message for each case & then use a Map to index into it.

```ts
import { m } from "./paraglide/messages.js";

const season = {
  spring: m.spring,
  summer: m.summer,
  autumn: m.autumn,
  winter: m.winter,
} as const;

const msg = season["spring"](); // Hello spring!
```

For date & currency formatting use the `.toLocaleString` method on the `Date` or `Number`.

```ts
import { m } from "./paraglide/messages.js";
import { locale } from "./paraglide/runtime.js";

const todaysDate = new Date();
m.today_is_the({
  date: todaysDate.toLocaleString(getLocale()),
});

const price = 100;
m.the_price_is({
  price: price.toLocaleString(getLocale(), {
    style: "currency",
    currency: "EUR",
  }),
});
```

## Getting a message in a specific language

If you want to force a language, but don't know _which_ language ahead of time you can pass the `locale` option as the second parameter to a message function. This is often handy on the server.

```js
import { m } from "./paraglide/messages.js";
const msg = m.hello({ name: "Samuel" }, { locale: "de" }); // Hallo Samuel!
```

### Reacting to language changes

Messages aren't reactive, so you will need to trigger a re-render when the language changes. You can register a callback using `onSetLocale()`. It is called whenever the locale changes.

If you are using a framework library this happens automatically.

```js
import { setLocale, onSetLocale } from "./paraglide/runtime.js";
import { m } from "./paraglide/messages.js";

onSetLocale((newLanguageTag) => {
  console.log(`The language changed to ${newLanguageTag}`);
});

setLocale("de"); // The language changed to de
setLocale("en"); // The language changed to en
```

Things to know about `onSetLocale()`:

- You can only register one listener. If you register a second listener it will throw an error.
- `onSetLocale` shouldn't be used on the server.

## Configuration

Your configuration is located in `project.inlang/settings.json`. There you declare which languages you support and
which one is the source-language.

```
// project.inlang/settings.json
{
    "baseLocale": "en",
    "locales": ["en", "de", "ar"],
}
```

### Moving the Translation Files

If you want your language files to be in a different location you can change the `pathPattern` of the [Inlang-Message-Format plugin](https://inlang.com/m/reootnfj/plugin-inlang-messageFormat).

```diff
// project.inlang/settings.json
{
	"plugin.inlang.messageFormat": {
-		"pathPattern": "./messages/{locale}.json"
+		"pathPattern": "./i18n/{locale}.json"
	}
}
```


