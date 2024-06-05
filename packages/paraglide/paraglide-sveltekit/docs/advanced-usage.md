# Advanced Setup

## Excluding certain routes

Exclude routes from being translated with the `exclude` option.

```js
// src/lib/i18n.js
import { createI18n } from "@inlang/paraglide-sveltekit"
import * as runtime from "$lib/paraglide/runtime.js"

export const i18n = createI18n(runtime, {
	// don't include the language or base path
	exclude: ["/admin", "/login", /^\/user\/\d+$/],
})
```

Excluded routes will:
- Not have any `rel="alternate"` links added to them
- Not have their Paths translated
- Not have links pointing to them translated

Make sure excluded pages are still wrapped in the `<ParaglideJS>` so that outgoing links are still translated. 

## Text direction

Paraglide guesses the text direction using the `Intl.Locale` API. This is not supported in all runtimes. Use the `textDirection` option to provide the text direction yourself.

```js
// src/lib/i18n.js
import { createI18n } from "@inlang/paraglide-sveltekit"
import * as runtime from "$lib/paraglide/runtime.js"

export const i18n = createI18n(runtime, {
	textDirection: {
		en: "ltr",
		ar: "rtl",
	},
})
```

## Accessing `lang` and `textDirection` 

On the server you can access the current language and text direction on `event.locals.paraglide`. 
On the client, you can call `languageTag()` exported `./paraglide/runtime.js`.  

## Full URLs in `<link rel="alternate">` tags

According to the spec, alternate links for pages must be full URLs. Do this by setting the `prerender.origin` option in your svelte.config.js.

```ts
// svelte.config.js

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		// ...
		prerender: {
			origin: "https://example.com",
		},
	},
}

export default config
```