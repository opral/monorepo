---
title: Localised Routing
description: Learn how the localised routing works in Paraglide-SvelteKit, how to use translated pathnames and how to do language negotiation.
---

# Localised Routing

### Translated Paths

You can have different paths for each language with the `pathnames` option. Don't include the language or the [base path](https://kit.svelte.dev/docs/configuration#paths).

- `/about` for English (default language)
- `/de/uber-uns` for German
- `/fr/a-propos` for French

```js
// src/lib/i18n.js
import { createI18n } from "@inlang/paraglide-sveltekit"
import * as runtime from "$lib/paraglide/runtime.js"
import * as m from "$lib/paraglide/messages.js"
import { match as int } from "../params/int.js"

export const i18n = createI18n(runtime, {
	pathnames: {
		"/about" : {
			en: "/about",
			de: "/uber-uns",
			fr: "/a-propos",
		},

		// You can use parameters
		// All translations must use identical parameters and names
		"/user/[id=int]/[...rest]" : {
			en: "/user/[id=int]/[...rest]",
			de: "/benutzer/[id=int]/[...rest]",
			fr: "/utilisateur/[id=int]/[...rest]",
		},
		// Instead of a map, you can also pass a message-function reference
		"/admin" : m.admin_path
	}

	// If you're using matchers in the pathnames, you need to pass them
	matchers: { int	}
})
```

By default the default language is located on your base path. Usually `/`. Unlike the other languages it does not have a language prefix. 

This reflects the default `prefixDefaultLanguage: "never"` behavior.

If you want to also have a prefix for the default language, use the `prefixDefaultLanguage: "always"` option.

```ts
// src/lib/i18n.js
export const i18n = createI18n(runtime, {
	prefixDefaultLanguage: "always",
})
```

This does make it ambigous which language should be used on `/` so language negotiation will kick in.

### Language Negotiation

Whenever the language cannot be determined from the URL alone the language negotiation is triggered. This happens in the following steps:

1. Check if the `paraglide:lang` cookie is set from previous visits, if so, use it
2. Negotiate the language from the `Accept-Language` header
3. Use the default language

After language negotiation you will be redirected to include the language in the URL.

### Changing the default Language

Usually your default language is the same as the `sourceLanguageTag` of your Inlang Project, but it doesn't have to be.

You can change it by passing a `defaultLanguageTag` option to `createI18n`

```ts
// src/lib/i18n.js

// sourceLanguageTag = "en"
export const i18n = createI18n(runtime, {
	defaultLanguageTag: "de",
})
```

## Automatic Link Localisation

`Paraglide-Sveltekit` automatically translates links on your components using a preprocessor. This affects:

- `href` attributes on `a` tags
- `formaction` attributes on `button` tags
- `action` attributes on `form`s

> If you have other attributes that you want to be translated [open an issue](https://www.github.com/opral/inlang-paraglide-js/issues).


### Link Translations

```svelte
<a href="/about">{m.about()}</a>

<!-- will become on of -->

<a href="/en/about">{m.about()}</a>
<a href="/de/uber-uns">{m.about()}</a>
<a href="/fr/a-propos">{m.about()}</a>
```

If you want a link to be translated into a _specific_ language set the `hreflang` attribute.

```svelte
<a href="/about" hreflang="de">{m.about()}</a>

<!-- Will always be german, regardless of the current language -->
<a href="/de/uber-uns" hreflang="de">{m.about()}</a>
```

Opt-out of translation by adding a `data-no-translate` attribute.

```svelte
<!-- this will never be translated -->
<a href="/about" data-no-translate>{m.about()}</a>
```

### Programmatic Navigation with Translated Paths

SvelteKit's `goto` and `redirect` cannot be translated automatically. Localize the URLs you pass to them with `i18n.resolveRoute()`.

```js
import { i18n } from '$lib/i18n.js'
import { redirect } from '@sveltejs/kit'
import { goto } from '$app/navigation'

redirect(i18n.resolveRoute("/about", "en"))

//Omitting the language argument uses the current languageTag()
goto(i18n.resolveRoute("/about"))
```

### Language Switchers

Language switchers are tricky because we need to dynamically translate the current URL path, which is itself translated. We need to get the untranslated version of the current path & translate it into the target language.

<doc-accordion
	heading="Wait, do I thought I don't need wrap my links with Paraglide-SvelteKit?"
	text="Language switchers are the one exception to this rule.">
</doc-accordion>

You can get the untranslated path using `i18n.route()`

```ts
// $page.url.pathname = "/base/de/uber-uns"
const route = i18n.route($page.url.pathname)
// route = "/base/about"
```

Use this to create a language switcher.

```svelte
<script>
	import { availableLanguageTags, languageTag } from "$lib/paraglide/runtime.js"
	import { i18n } from '$lib/i18n.js'
	import { page } from '$app/stores'
</script>

{#each availableLanguageTags as lang}
	<!-- the hreflang attribute decides which language the link points to -->
	<a 
		href={i18n.route($page.url.pathname)}
		hreflang={lang}
		aria-current={lang === languageTag() ? "page" : undefined}
	>
		{lang}
	</a>
{/each}
```
