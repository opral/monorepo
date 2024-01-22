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

This replaces the need for calling `paraglide-js compile` in your build script. It will automatically compiler and recompile your translations when you run `npm run dev` or `npm run build`. 

```diff 
// package.json
	"scripts": {
-		"build": "paraglide-js compile && vite build",
+		"build": "vite build",
	}
```

It also registers the Svelte Preprocessor that's necessary for translating links, but more on that later.

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

Additionally, you need to add the `lang` attribute to your `html` tag. This is important for screen readers. Unfortunately, Svelte doesn't offer a way to do this from inside a component. You need to set it in your `src/hooks.server.js` file. 

The easiest way to do this is to set the `lang` attribute in `src/app.html` with an easy to recognize placeholder.

```html
<html lang="__LANG__">
```

Then, in your `src/hooks.server.js` file, replace the placeholder with the current language. Again, the `i18n` instance can help you with that.

```js
import { i18n } from '$lib/i18n.js'

export const handle = i18n.handle({ langPlaceholder: "__LANG__" })
```

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

SvelteKit offers a few ways of navigating programmatically. Mainly `goto` and `redirect`. Unfortunately, translating these automatically is not practical. For these cases, you can use the `route` method on the `i18n` instance. It takes the absolute path that you want to translate and the language you want to translate it to.

```js
import { i18n } from '$lib/i18n.js'
import { redirect } from '@sveltejs/kit'
import { goto } from '$app/navigation'

redirect(i18n.route("/about", "en"))

//Omitting the language default to the current language
goto(i18n.route("/about"))
```

Fortunately you don't need to do this often. Most of the time the an `a` tag is enough.