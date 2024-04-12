![Dead Simple i18n. Typesafe, Small Footprint, SEO-Friendly and, with an IDE Integration.](https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/source-code/paraglide/paraglide-js-adapter-sveltekit/assets/header.png)

<doc-features>
<doc-feature text-color="#0F172A" color="#E1EFF7" title="Internationalized Routing" image="https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/source-code/paraglide/paraglide-js-adapter-next/assets/i18n-routing.png"></doc-feature>
<doc-feature text-color="#0F172A" color="#E1EFF7" title="Tiny Bundle Size" image="https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/source-code/paraglide/paraglide-js-adapter-next/assets/bundle-size.png"></doc-feature>
<doc-feature text-color="#0F172A" color="#E1EFF7" title="No route Param needed" image="https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/source-code/paraglide/paraglide-js-adapter-sveltekit/assets/no-param.png"></doc-feature>
</doc-features>


## Getting Started

### 1. Install dependencies

Install [ParaglideJS](https://inlang.com/m/gerre34r/library-inlang-paraglideJs) and the [ParaglideJS SvelteKit Adapter](https://inlang.com/m/dxnzrydw/paraglide-sveltekit-i18n).

```bash
npx @inlang/paraglide-js init
npm i -D @inlang/paraglide-js-adapter-sveltekit
```

This will generate a `messages/{lang}.json` file for each of your languages. This is where your translation files live. 

### 2. Add the Vite Plugin 

Add the adapter-plugin to your `vite.config.js` file. This will make sure to rerun the paraglide compiler when needed and add the link preprocessor.

```js
import { paraglide } from "@inlang/paraglide-js-adapter-sveltekit/vite"

export default defineConfig({
	plugins: [
		paraglide({
			//recommended
			project: "./project.inlang",
			outdir: "./src/lib/paraglide",
		}),
		sveltekit(),
	],
})
```

### 3. Initialise the Adapter

Create a `src/lib/i18n.js` file:

```js
// src/lib/i18n.js
import { createI18n } from "@inlang/paraglide-js-adapter-sveltekit"
import * as runtime from "$lib/paraglide/runtime.js"

export const i18n = createI18n(runtime);
```

`createI18n` will be your one-stop shop for configuring the adapter.

<doc-accordion
	heading="Does this need to be in src/lib/i18n.js ?"
	text="No. You can place this file anywhere. Be aware that you will be importing from here a lot, so make sure it's somewhere convenient.">
</doc-accordion>

### 4. Add the Language Provider to your Layout

Add the `ParaglideJS` component to your layout and pass it the `i18n` instance.

```svelte
<!-- src/routes/+layout.svelte -->
<script>
    import { ParaglideJS } from '@inlang/paraglide-js-adapter-sveltekit'
	import { i18n } from '$lib/i18n.js'
</script>

<ParaglideJS {i18n}>
    <slot />
</ParaglideJS>
```

### 5. Add the Hooks

In your `src/hooks.js` file, use the `i18n` instance to add the `reroute` hook:

```js
import { i18n } from '$lib/i18n.js'
export const reroute = i18n.reroute()
```

> The reroute hook was added in SvelteKit 2.3.0

In `src/hooks.server.js` add the handle hook. 

```js
// src/hooks.server.js
import { i18n } from '$lib/i18n.js'
export const handle = i18n.handle()
```

This will make the language and text-direction on `event.locals.paraglide`.
To set the `lang` and `dir` attributes on your `<html>` tag add placeholders in `src/app.html`. These placeholders will be replaced by the `handle` hook.

```html
<!-- src/app.html -->
<html lang="%paraglide.lang%" dir="%paraglide.textDirection%"> 
```

## Go try it out!

Visit `/` to see your default language, and `/{lang}` to see other languages. All links should be translated automatically.

## Advanced Setup

### Excluding certain routes

Exclude routes from being translated with the `exclude` option.

```js
import { createI18n } from "@inlang/paraglide-js-adapter-sveltekit"
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

### Translated Paths

- `/en/about` for English
- `/de/uber-uns` for German
- `/fr/a-propos` for French

You can have different paths for each language with the `pathnames` option. 
Don't include the language or the [base path](https://kit.svelte.dev/docs/configuration#paths).

```js
import { createI18n } from "@inlang/paraglide-js-adapter-sveltekit"
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
		// Instead of a map, you can also pass a message-function
		"/admin" : m.admin_path
	}

	// If you're using matchers in the pathnames, you need to pass them
	matchers: { int	}
})
```

### Customizing Link Translation

Links are translated automatically using a preprocessor. This means that you can use the normal `a`-tag and the adapter will translate it for you.

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

Other attributes that are also translated are:
- The `action` attribute on `form` elements
- The `formaction` attribute on `button` elements

> If you have other attributes that you want to be translated [open an issue](https://www.github.com/opral/inlang-paraglide-js/issues).

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
	heading="Wait, do I thought I don't need wrap my links with the Adapter?"
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

### Overriding Text direction

Paraglide guesses the text direction using the `Intl.Locale` API. This is not supported in all runtimes. Use the `textDirection` option to provide the text direction yourself.

```js
import { createI18n } from "@inlang/paraglide-js-adapter-sveltekit"
import * as runtime from "$lib/paraglide/runtime.js"

export const i18n = createI18n(runtime, {
	textDirection: {
		en: "ltr",
		ar: "rtl",
	},
})
```

### Accessing `lang` and `textDirection` 

On the server you can access the current language and text direction on `event.locals.paraglide`. 
On the client, you can call `languageTag()` exported `./paraglide/runtime.js`.  

### Using the Language on the Server

#### Avoiding Cross-Talk

SvelteKit does two kinds of work on the server: _Loading_ and _Rendering_. 

- _Loading_ includes running your `load` functions, `actions` or server-hooks. 
- _Rendering_ is anything that happens in or is called from a `.svelte` file.

Loading is asynchronous & rendering is synchronous. 

During the asynchronous loading, there is danger of crosstalk. If you aren't careful it's possible for one request to override the language of another request. You can avoid this by explicitly specifying which language a message should be in.

```ts
import * as m from "$lib/paraglide/messages.js"

export async function load({ locals }) {
  const translatedText = m.some_message({ ...message_params }, { languageTag: locals.paraglide.lang })
  return { translatedText }
}
```

During rendering there is no danger of crosstalk. You can safely use messages and the `langaugeTag()` function. 

#### Re-Loading Language-Dependent data

You can tell a load function to re-run on language changes by calling `depends("paraglide:lang")`.

```ts
export async function load({ depends }) {
  // The Adapter automatically calls `invalidate("paraglide:lang")` whenever the langauge changes
  // This tells SvelteKit to re-run this function whenever that happens
  depends("paraglide:lang") 
  return await myLanguageSpecificData();
}
```

## Caveats

1. Links in the same Layout Component as `<ParagldieJS>` will not be translated. This will also log a warning in development.
2. Messages are not reactive. Don't use them in server-side module scope.
3. Side effects triggered by `data` will run on language changes even if the data didn't change. If the data is language-dependent the side effect will run twice. 

### Using messages in `+layout.svelte`

The language state get's set when the `<ParaglideJS>` component is mounted. Since you usually place it inside `+layout.svelte` using messages in the layout's `<script>` can cause issues.

```svelte
<script>
    import { ParaglideJS } from '@inlang/paraglide-js-adapter-sveltekit'
	import { i18n } from '$lib/i18n.js'

	//using messages here can cause hydration issues
</script>

<ParaglideJS {i18n}>
	<!-- Using messages here is fine -->
    <slot />
</ParaglideJS>
```

### Issues on Vercel

SvelteKit's `reroute` hook currently doens't play well with Vercel (see [sveltejs/kit#11879](https://github.com/sveltejs/kit/issues/11879)), which means that we need to slightly adapt the adapter setup to make it work when deployed to Vercel.

1. Remove the `reroute` hook from `src/hooks.js`
2. Move the routes you want to localize `routes` into a `[[locale]]` folder
3. Don't use translated `pathnames`

We are working on contributing a fix for [sveltejs/kit#11879](https://github.com/sveltejs/kit/issues/11879), so this workaround will hopefully not be needed much longer.

## FAQ

<doc-accordion
	heading="Can I also prefix the default language?"
	text="Yes, you can also include the default language in the URL by passing prefixDefaultLanguage: 'always' to createI18n.">
</doc-accordion>

<doc-accordion
	heading="Can I change default language?"
	text="Yes, using the 'defaultLanguage' option on 'createI18n'.">
</doc-accordion>

<doc-accordion
	heading="Do I have to have the language in the URL?"
	text="Using the right options you can get the language from anywhere, but the main benefit of using this library is the i18n routing. If you don't plan on using that you might be
	better off using ParaglideJS directly.">
</doc-accordion>

<doc-accordion
	heading="'Can't find module $paraglide/runtime.js' - What do I do?"
	text="This likely means that you haven't registered the $paraglide alias for src/paraglide in svelte.config.js. Try adding that. Check the example if you're stuck">
</doc-accordion>

<doc-accordion
	heading="How can I make my alternate links full urls when prerendering?"
	text="According to the spec, alternate links should be full urls that include the protocol and origin. By default the adapter can't know which URL your page will be deployed to while prerendering, so it only includes the path in the alternate url, not the origin or protocol. This works, but is suboptimal. You can tell the adapter which url you will be deploying to by setting kit.prerender.origin in your svelte.config.js">
</doc-accordion>

<doc-accordion
	heading="Does this work with vite-plugin-kit-routes"
	text="Yes! Vite-plugin-kit-routes should work with no additional configuration">
</doc-accordion>

<doc-accordion
	heading="Can I dynamically fetch translations from an external server?"
	text="Paraglide is a compiler, so all translations need to be known at build time. You can of course manually react to the current language & fetch external content, but you will end up implementing your own solution for dynamically fetched translations.">
</doc-accordion>

<doc-accordion
	heading="Help! Links in +layout.svelte aren't being translated"
	text="As stated in the caveats, <a> tags are not translated if they are in the same component as the <ParaglideJS> component. Move your Links into a different component and it should work.">
</doc-accordion>


## Roadmap to 1.0

- Translate parameters themselves
- More routing flexibility
	- Domain Based routing
	- Language Detection & Redirects
- Fix the Caveats
	- Allow links in the same component as <ParaglideJS>
	- Run seamlessly when deployed to Vercel
	- Fix side-effects that are triggered by page-`data` changing double triggering on language changes if they depend on the language. 

## Playground

Play around with it on [StackBlitz](https://stackblitz.com/~/github.com/lorissigrist/paraglide-sveltekit-example)
