# Paraglide Adapter SvelteKit

Everything you need to internationalize your SvelteKit app with Paraglide.

**Features**

- 🪂 Automatically set & manage the language for Paraglide
- 💨 A breeze to set up - No need to change your `routes`
- 🪄 Automatically translate existing links
- 💬 Translated paths
- 🤖 SEO friendly out of the box

## Quickstart

There are four steps to setting up the Paraglide Adapter with SvelteKit.

1. Set up the Vite Plugin
2. Initialise the Adapter
3. Add the Adapter Component to your Layout
4. Add the Hooks.

We assume that you already have a SvelteKit app set up. If you don't, please follow the [SvelteKit's getting Started Guide](https://kit.svelte.dev/docs/creating-a-project).

### Step Zero: Set up Paraglide

Before you can use the adapter, you need to set up Paraglide. If you have already done this, you can skip this step.

Otherwise, run the following command in your project root and follow the instructions:

```bash
npx @inlang/paraglide-js init
```

To learn more, please read the official [Paraglide documentation](https://inlang.com/m/gerre34r/library-inlang-paraglideJs).

### 1. Add the Vite Plugin

```bash
npm i -D @inlang/paraglide-js-adapter-sveltekit
```

Then add the adapter to your `vite.config.js` file:

```js
import { paraglide } from "@inlang/paraglide-js-adapter-sveltekit/vite"

export default defineConfig({
	plugins: [
		paraglide({
			project: "./project.inlang",
			outdir: "./src/paraglide",
		}),
		sveltekit(),
	],
})
```

<doc-accordion 
	heading="Do I still need to run `paraglide-js compile` ?" 
	text="This replaces the need for calling `paraglide-js compile` in your build script. It will automatically compiler and recompile your translations when you run npm run dev or npm run build. ">
</doc-accordion>

### 2. Initialise the Adapter

Create a file somewhere, for example `src/lib/i18n.js` and add the following code:

```js
import { createI18n } from "@inlang/paraglide-js-adapter-sveltekit"
import * as runtime from "$paraglide/runtime.js"

export const i18n = createI18n(runtime);
```

This `i18n` instance is the heart of the adapter. It will provide you with all the functionality you need. `createI18n` is your one-stop-shop for configuring the adapter.

### 3. Set up the Language Provider

To provide the language to your app, add the `ParaglideJS` component to your layout and pass it the `routing` instance.

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

This will do a few things for you:
1. Automatically set the language for Paraglide
2. Automatically add `rel="alternate"` links to your page head
3. Automatically translate any `<a href>` attributes on your page. You don't need to change them

### 4. Add the Reroute hook

Finally, let's add the `reroute` hook that makes it all possible. In your `src/hooks.js` file, use the `i18n` instance to add the `reroute` hook:

```js
import { i18n } from '$lib/i18n.js'
export const reroute = i18n.reroute()
```

> The reroute hook was added in SvelteKit 2.3.0. You might have to update your SvelteKit version.

## 5. Go try it out!

That's it, you should now have i18n routing in your SvelteKit app. Go try it out!

Visit `/` to see your default language, and `/{lang}` to see other languages. All links should be translated automatically.

## Advanced Setup

### SEO Considerations

The `<ParaglideJS>` component automatically adds `rel="alternate"` links to your page head. This is important for SEO. It tells search engines that there are other versions of this page in other languages.

```html
<link rel="alternate" hreflang="en" href="/en/about" />
<link rel="alternate" hreflang="de" href="/de/uber-uns" />
```

Additionally, you need to add the `lang` and `dir` attributes to your `html` tag. This is important for screen readers. Unfortunately, Svelte doesn't offer a way to do this from inside a component. You need to set it in your `src/hooks.server.js` file. 

The easiest way to do this is to set the `lang` and `dir` attributes in `src/app.html` with an easy to recognize placeholder.

```html
<html lang="%paraglide.lang%" dir="%paraglide.textDirection%"> 
```

Then, in your `src/hooks.server.js` file, you can use `i18n.handle()` to replace the placeholders with the correct values. `%paraglide.lang%` and `%paraglide.textDirection%` are the default placeholders. You can change them by passing the `langPlaceholder` and `textDirectionPlaceholder` options to `handle`.


```js
import { i18n } from '$lib/i18n.js'

export const handle = i18n.handle()
```

The handle hook will also make `lang` and `textDirection` available in `event.locals.paraglide`, so you can use them elsewhere in your app.

### Excluding certain routes

If you have routes that you don't want to translate, you can exclude them by passing them to the `exclude` option:

```js
import { createI18n } from "@inlang/paraglide-js-adapter-sveltekit"
import * as runtime from "../paraglide/runtime.js"

export const i18n = createI18n(runtime, {
	exclude: ["/admin", "/login", /^\/user\/\d+$/],
})
```

Excluded routes will:
- Not have any `rel="alternate"` links added to them
- Not have their Paths translated
- Not have links pointing to them translated

If you still want outgoing links to be translated, make sure the page is till wrapped in the `ParaglideJS` component.

### Translated Paths

With the Paraglide SvelteKit Adapter, you can have different paths for each language. For example, you can have:
- `/en/about` for English
- `/de/uber-uns` for German
- `/fr/a-propos` for French

Setting this up is easy with the `pathnames` option. Specify it duting initialisation:

```js
import { createI18n } from "@inlang/paraglide-js-adapter-sveltekit"
import * as runtime from "../paraglide/runtime.js"

export const i18n = createI18n(runtime, {
	"/about" : {
		en: "/about",
		de: "/uber-uns",
		fr: "/a-propos",
	},
})
```

> You don't need to include the language, or your site's base path. Those will be added automatically.

If you now visit `/fr/a-propos` you should see the French version of your about page.

You can also use parameters in your translations. This is useful for pages that have a dynamic ID, like a user profile page. Parameters are added in square brackets.

```js
import { createI18n } from "@inlang/paraglide-js-adapter-sveltekit"
import * as runtime from "../paraglide/runtime.js"

export const i18n = createI18n(runtime, {
	"/user/[username]" : {
		en: "/user/[username]",
		de: "/benutzer/[username]",
		fr: "/utilisateur/[username]",
	},
})
```

Optional parameters, catch-all parameters and param matchers are not yet supported.

> You need to use all parameters in all translations. If you don't, Paraglide will not be able to use the correct path.

For convenience, you can also pass a message-function as the value of the pathnames object. 

```js
import { createI18n } from "@inlang/paraglide-js-adapter-sveltekit"
import * as runtime from "../paraglide/runtime.js"
import * as m from "../paraglide/messages.js"

export const i18n = createI18n(runtime, {
	// do not call the function - pass a reference
	"/about" : m.about_path
})
```

## Customizing Link Translation

Links are translated automatically using a preprocessor. This means that you can use the normal `a` tag and the adapter will translate it for you.

```svelte
<a href="/about">{m.about()}</a>
```

Will become:

```svelte
<a href="/en/about">{m.about()}</a>
<a href="/de/uber-uns">{m.about()}</a>
<a href="/fr/a-propos">{m.about()}</a>
```

depending on the current language.

If you want a link to be translated into a specific language, you can use the `hreflang` attribute.

```svelte
<!-- This -->
<a href="/about" hreflang="de">{m.about()}</a>

<!-- Will become -->
<a href="/de/uber-uns" hreflang="de">{m.about()}</a>
```

You can also opt out of translation alltogether by adding a `data-no-translate` attribute. This will leave the `href` attribute as is.

```svelte
<a href="/about" data-no-translate>{m.about()}</a>
```

Other attributes that are also translated are:
- The `action` attribute on `form` elements
- The `formaction` attribute on `button` elements

> If you have more attributes that you want to be translated, please open an issue.

### Programmatic Navigation with Translated Paths

SvelteKit offers a few ways of navigating programmatically. Mainly `goto` and `redirect`. Unfortunately, translating these automatically is not practical. For these cases, you can use the `resolveRoute` method on the `i18n` instance. It takes the absolute path that you want to translate and the language you want to translate it to.

```js
import { i18n } from '$lib/i18n.js'
import { redirect } from '@sveltejs/kit'
import { goto } from '$app/navigation'

redirect(i18n.resolveRoute("/about", "en"))

//Omitting the language defaults to the current language
goto(i18n.resolveRoute("/about"))
```

Fortunately you don't need to do this often. Most of the time the an `a` tag is enough.

### Language Switchers

Language switchers are tricky, because we need to get the route correspondingto the current URL path, which is of course translated. We need to somehow get the untranslated version of the path, so that we can translate it again.

<doc-accordion
	heading="Wait, do I thought I don't need wrap my links with the Adapter?"
	text="Language switchers are the one exception to this rule.">
</doc-accordion>


Fortunately, the `i18n` instance can help us with that. It exposes a `route` method that takes the current path and return the untranslated version of it.

```ts
// $page.url.pathname = "/base/de/uber-uns"
const route = i18n.route($page.url.pathname)
// route = "/base/about"
```

We can use this to create a language switcher that links to the current page in a different language.
1. Get the untranslated version of the current path
2. Automatically translate it into all available languages with the `<a>` tag using the `hreflang` attribute

```svelte
<script>
	import { availableLanguageTags } from "../paraglide/runtime.js"
	import { i18n } from '$lib/i18n.js'
	import { page } from '$app/stores'
</script>

{#each availableLanguageTags as lang}
	<a 
		href={i18n.route($page.url.pathname)}
		hreflang={lang}
		aria-current={lang === languageTag() ? "page" : undefined}
	>
		{lang}
	</a>
{/each}
```

This is also usefull for detecting which navigation item is currently active.

```svelte
<li aria-current={i18n.route($page.url.pathname) === "/" ? "page" : undefined}>
	<a href="/">{m.home()}</a>
</li>

<li aria-current={i18n.route($page.url.pathname) === "/about" ? "page" : undefined}>
	<a href="/about">{m.about()}</a>
</li>
```

### Determining text direction

Setting the text-direction correctly is very important. By default, Paragldie will try to guess the text direction based on the language using the `Intl.Locale` API. Unfortunately, this API is not supported in all browsers. If you want to make sure that the text direction is always correct, you can pass the `textDirection` option to `createI18n`.

```js
import { createI18n } from "@inlang/paraglide-js-adapter-sveltekit"
import * as runtime from "../paraglide/runtime.js"

export const i18n = createI18n(runtime, {
	textDirection: {
		en: "ltr",
		ar: "rtl",
	},
})
```


### Accessing `lang` and `textDirection` 

You can access the current language and text direction on `event.locals.paraglide` anywhere on your server. On the client, you can use the `languageTag()` function from `./paraglide/runtime.js` to access the current language.  

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
	heading="My prerenderd pages include 'http://sveltekit-prerender', what's going on?"
	text="There are some URLs that need to be fully qualified to be spec compliant. Usually SvelteKit
	can guess the URL based on your current page, but during prerendering it has no idea where the files will be deployed, so it defaults to 'http://sveltekit-prerender'. You need to explicity tell it the URL of your Site. You can do this with the 'kit.prerender.origin' option in 'svelte.config.js'.">
</doc-accordion>

<doc-accordion
	heading="Does this work with vite-plugin-kit-routes"
	text="Yes! Vite-plugin-kit-routes should work with no additional configuration">
</doc-accordion>

<doc-accordion
	heading="Can I dynamically fetch translations from an external server?"
	text="Paraglide is a compiler, so all translations need to be known at build time. You can of course manually react to the current language & fetch external content, but you will end up implementing your own solution for dynamically fetched translations.">
</doc-accordion>

## Roadmap

- [ ] Expand the route features in Path translation
  - [ ] Optional parameters
  - [ ] Catch-all parameters
  - [ ] Parameter matchers

## Playground

Play around with it on [StackBlitz](https://stackblitz.com/~/github.com/lorissigrist/paraglide-sveltekit-example)