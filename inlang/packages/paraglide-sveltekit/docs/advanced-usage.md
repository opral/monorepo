# Advanced Setup

## Excluding certain routes

> ⚠️ The `exclude` option has been reported as buggy.
> 
> If you encounter any issues with it, please open a PR that fixes/
> improves the exlusion mechanism. A PR will be reviewed promptly.

Exclude routes from being translated with the `exclude` option.

```js
// src/lib/i18n.js
import { createI18n } from "@inlang/paraglide-sveltekit"
import * as runtime from "$lib/paraglide/runtime.js"

export const i18n = createI18n(runtime, {
	// don't include the /api/ routes
	// this matches any route that starts with /api/
	exclude: [/^\/api\//],
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