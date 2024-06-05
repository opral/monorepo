# Usage

## Working with Messages

## Using messages in Code

### Complex Formatting

The Message Format is still quite young, so advanced formats like plurals, formatting functions, and markup interpolation are currently not supported but are all planned

You can still achieve complex formatting like so:

For a message with multiple cases, aka a _select message_, you can define a message for each case & then use a Map to index into it.

```ts
import * as m from "./paraglide/messages.js"

const season = {
	spring: m.spring,
	summer: m.summer,
	autumn: m.autumn,
	winter: m.winter,
} as const

const msg = season["spring"]() // Hello spring!
```

For date & currency formatting use the `.toLocaleString` method on the `Date` or `Number`.

```ts
import * as m from "./paraglide/messages.js"
import { languageTag } from "./paraglide/runtime.js"

const todaysDate = new Date();
m.today_is_the({ 
	date: todaysDate.toLocaleString(languageTag()) 
})

const price = 100;
m.the_price_is({
	price: price.toLocaleString(languageTag(), {
		style: "currency",
		currency: "EUR",
	})
})
```

You can put HTML into the messages. This is useful for links and images. 

```json
// messages/en.json
{
	"you_must_agree_to_the_tos": "You must agree to the <a href='/en/tos'>Terms of Service</a>."
}
```
```json
// messages/de.json
{
	you_must_agree_to_the_tos": "Sie müssen den <a href='/de/agb'>Nutzungsbedingungen</a> zustimmen."
}
```

There is currently no way to interpolate framework components into messages. If you require components mid-message you will need to create a one-off component for that bit of text.


## Getting a message in a specific language

You can import a message in a specific language from `paraglide/messages/{lang}.js`.

```ts
import * as m from "./paraglide/messages/de.js"
m.hello() // Hallo Welt
```

If you want to force a language, but don't know _which_ language ahead of time you can pass the `languageTag` option as the second parameter to a message function. This is often handy on the server.

```js
import * as m from "./paraglide/messages.js"
const msg = m.hello({ name: "Samuel" }, { languageTag: "de" }) // Hallo Samuel!
```

### Lazy-Loading

Paraglide discourages lazy-loading translations since it causes a render-fetch waterfall which hurts Web Vitals. Learn more about why lazy-loading is bad & what to do instead in [our blog post on lazy-loading](https://inlang.com/g/mqlyfa7l/guide-lorissigrist-dontlazyload). 

If you want to do it anyway, lazily import the language-specific message files. 

```ts
const lazyGerman = await import("./paraglide/messages/de.js")
lazyGerman.hello() // Hallo Welt
```


## Language Management

### Setting the language

You can set the [language tag](https://www.inlang.com/m/8y8sxj09/library-inlang-languageTag) by calling `setLanguageTag()` with the desired language, or a getter function. Any subsequent calls to either `languageTag()` or a message function will use the new language tag.

```js
import { setLanguageTag } from "./paraglide/runtime.js"
import * as m from "./paraglide/messages.js"

setLanguageTag("de")
m.hello() // Hallo Welt!

setLanguageTag(() => document.documentElement.lang /* en */)
m.hello() // Hello world!
```

The [language tag](https://www.inlang.com/m/8y8sxj09/library-inlang-languageTag) is global, so you need to be careful with it on the server to make sure multiple requests don't interfere with each other. Always use a getter-function that returns the current language tag _for the current request_.

You will need to call `setLanguageTag` on both the server and the client since they run in separate processes.

### Reacting to language changes

Messages aren't reactive, so you will need to trigger a re-render when the language changes. You can register a callback using `onSetLanguageTag()`. It is called whenever the [language tag](https://www.inlang.com/m/8y8sxj09/library-inlang-languageTag) changes.

If you are using a [framework-specific library](#use-it-with-your-favorite-framework) this is done for you.

```js
import { setLanguageTag, onSetLanguageTag } from "./paraglide/runtime.js"
import * as m from "./paraglide/messages.js"

onSetLanguageTag((newLanguageTag) => {
	console.log(`The language changed to ${newLanguageTag}`)
})

setLanguageTag("de") // The language changed to de
setLanguageTag("en") // The language changed to en
```

Things to know about `onSetLanguageTag()`:

- You can only register one listener. If you register a second listener it will throw an error.
- `onSetLanguageTag` shouldn't be used on the server.

## Configuration

Your configuration is located in `project.inlang/settings.json`. There you declare which languages you support and
which one is the source-language.

```
// project.inlang/settings.json
{
    "$schema": "https://inlang.com/schema/project-settings",
    "sourceLanguageTag": "en",
    "languageTags": ["en", "de", "ar"],
}
```

### Moving the Translation Files

If you want your language files to be in a different location you can change the `pathPattern` of the [Inlang-Message-Format plugin](https://inlang.com/m/reootnfj/plugin-inlang-messageFormat).

```diff
// project.inlang/settings.json
{
	"plugin.inlang.messageFormat": {
-		"pathPattern": "./messages/{languageTag}.json"
+		"pathPattern": "./i18n/{languageTag}.json"
	}
}
```

## CLI Reference

### `paraglide-js init`

Initializes Paraglide in the current directory.

No options available

### `paraglide-js compile`

- `--watch` - Watch for message-changes and automatically recompile.
- `--project <path>` - The relative path to the Inlang Project with the messages that should be compiled (required)
- `--outdir <path>` - The relative path to the output directory in which the compiled files should be placed
