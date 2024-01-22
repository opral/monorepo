# Build a global [SvelteKit](https://kit.svelte.dev) app

In this guide, we will be creating a simple SvelteKit app with i18n routing, using Paraglide for translations. This should be all you need to get started with Paraglide.

We will be using [Paraglide.js](https://inlang.com/m/gerre34r/library-inlang-paraglideJs), the [inlang-message-format](https://inlang.com/m/reootnfj/plugin-inlang-messageFormat) and [inlang's IDE Extension](https://inlang.com/m/r7kp499g/app-inlang-ideExtension).

## 1. Create a SvelteKit app

Set up a SvelteKit app as you normally would. If you need help, check out the [SvelteKit documentation](https://kit.svelte.dev/docs/creating-a-project).

```cmd
npm create svelte@latest my-app
cd my-app
npm install
npm run dev
git init
```

## 2. Initialize Paraglide

We recommend that you initialize Paraglide using the CLI. This will make sure all files are in the right place, and that the correct dependencies are installed.

In the root of your project, run:

```cmd
npx @inlang/paraglide-js@latest init
```

The CLI might ask you some questions depending on your environment. Answer them thoroughly & follow the instructions.

```cmd
npx @inlang/paraglide-js@latest init

✔ Successfully created a new inlang project.
✔ Added @inlang/paraglide-js to the dependencies in package.json.
✔ Successfully added the compile command to the build step in package.json.

 ╭──────────────────────────────────────────────────────────────────────────────────────╮
 │                                                                                      │
 │  inlang Paraglide-JS has been set up sucessfully.                                    │
 │                                                                                      │
 │  1. Run your install command (npm i, yarn install, etc)                              │
 │  2. Run the build script (npm run build, or similar.)                                │
 │  3. Done :) Happy paragliding 🪂                                                     │
 │                                                                                      │
 │   For questions and feedback, visit https://github.com/opral/monorepo/discussions.  │
 │                                                                                      │
 │                                                                                      │
 ╰──────────────────────────────────────────────────────────────────────────────────────╯
```

### Definining an Alias

Paraglide will put the translations in the `./src/paraglide` folder, as specified in the `vite.config.ts` file. Since we will be importing from there a lot, adding an alias is a good idea.

Luckily, SvelteKit makes this super easy. It has a dedicated `alias` option in the `kit` object in `svelte.config.js`.

```js
import adapter from "@sveltejs/adapter-auto"
import { vitePreprocess } from "@sveltejs/kit/vite"

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter(),

		alias: {
			//You can call this whatever you want
			$paraglide: "./src/paraglide",
		},
	},
}

export default config
```

With the alias, we can import the translations like this:

```ts
import * as m from "$paraglide/messages"
```

Neat right?

## 3. Adding and Using Messages

### Adding Messages

By default, paraglide uses the [inlang-message-format Plugin](https://inlang.com/m/reootnfj/plugin-inlang-messageFormat) for storing messages.

The default path for translation files are `./messages/{lang}.json`. You can change this option in `./project.inlang/settings.json`. The Files just contain a Key-Value pair of the message ID and the message itself.

```json
// messages/en.json
{
	"$schema": "https://inlang.com/schema/inlang-message-format",
	"hello_world": "Hello World",
	"greeting": "Hello {name}"
}
```

You can add messages in two ways:

1. Manually editing the translation files
2. Using the [inlang IDE Extension](https://inlang.com/m/r7kp499g/app-inlang-ideExtension)

### Add messages through ide extension (recommended)

- Install the ide extension from the vs-code marketplace.
  [See extension on inlang.com](https://inlang.com/m/r7kp499g/app-inlang-ideExtension)
  [vs-code marketplace](https://marketplace.visualstudio.com/items?itemName=inlang.vs-code-extension)

- Reload window (only needed once).
  `⌘ or Ctrl` + `Shift` + `P` -> Developer: Reload Window. On the bottom it should display for some seconds after relaod: `inlang's extension activated`.

- Select a hard-coded string, for example, on the About page. Mark the string with your cursor and hit `command` + `.` -> Inlang: Extract
  message. Give the message an ID and hit enter.

- This command extracts the hard-coded string and places it into the source language translation file `en.json` in the `messages` directory.

### Using Messages

You can import messages into your code like this:

```ts
import * as m from "$paraglide/messages"

m.hello_world() // Hello World
m.greeting({ name: "John" }) // Hello John
```

Each message is a function that returns the message in the current language. If the message requires parameters, typescript will enforce that you pass them in.

You can change which language is currently active by using the `setLanguageTag` function exported from `$paraglide/runtime`.

```ts
import * as m from "$paraglide/messages"
import { setLanguageTag } from "$paraglide/runtime"

setLanguageTag("en")
m.hello_world() // Hello World
m.greeting({ name: "John" }) // Hello John

setLanguageTag("de")
m.hello_world() // Hallo Welt
m.greeting({ name: "John" }) // Hallo John
```

Messages are **not** reactive, so you will need to re-render your component when the language changes. We will see how to do that in the next step.

## 4. Installing the SvelteKit Adapter

Paraglide adapters are framework-specific packages that make it easier to use Paraglide. They provide a few things:
- Automatically manage language state
- i18n routing
- SEO considerations

Install the SvelteKit adapter:

```cmd
npm i @inlang/paraglide-js-adapter-sveltekit
```


## 4.1 Adding the Vite Plugin

The SvelteKit adapter provides a Vite plugin that automatically compiles your translations. This means that you don't need to call `paraglide-js compile` in your build script.

```ts
import { sveltekit } from "@sveltejs/kit/vite"
import { paraglide } from "@inlang/paraglide-js-adapter-sveltekit/vite"
import { defineConfig } from "vite"

export default defineConfig({
	plugins: [
		sveltekit(),
		paraglide({
			project: "./project.inlang",
			outdir: "./src/paraglide",
		}),
	],
})
```

## 4.2 Initializing the Adapter

To initialize the Adapter, we need to call `createI18n` and pass it the paraglide runtime. We can do this in a new file, for example `./src/lib/i18n.ts`.

```ts
// ./src/lib/i18n.ts
import { createI18n } from "@inlang/paraglide-js-adapter-sveltekit"
import * as runtime from "$paraglide/runtime"

export const i18n = createI18n(runtime)
```

## 4.3 Adding the Adapter Component to your Layout

To provide the language to your app, add the `ParaglideJS` component to your layout and pass it the `routing` instance.

```svelte
<!-- src/routes/+layout.svelte -->
<script>
	import { ParaglideJS } from '@inlang/paraglide-js-adapter-sveltekit'
	import { i18n } from '$lib/i18n'
</script>

<ParaglideJS {i18n}>
	<slot />
</ParaglideJS>
```

This component will do a few things for you:
1. It will set the current language based on the URL.
2. It will re-render your app when the language changes.
3. It will rewrite any links inside your app to include the language tag. (eg rewrite `/about` to `/en/about`)
4. It will add the `rel="alternate"` link tags to your `<head>` for SEO purposes.


## 4.4 Adding the Hooks

The last thing you need is to set up the `reroute` hook in `src/hooks.js`. Again, the `i18n` instance has you covered.

```ts
// ./src/hooks.js
import { i18n } from "$lib/i18n"
export const reroute = i18n.reroute()
```

> This requires SvelteKit Version 2.3 or higher. Please upgrade if you are using an older version.



### Adding a language switcher

Language switchers are challenging, because they require us to translate the page we're currently on.
Because there are so many different ways to implement i18n routing, we can't provide a one-size-fits-all solution. Regardless, you will probably need to define a `route` function that takes in a path (in any language), and returns the path in the specified language.

```ts
// ./src/lib/i18n-routing.ts
import {
	sourceLanguageTag,
	type AvailableLanguageTag,
	availableLanguageTags,
} from "$paraglide/runtime"

/**
 * Returns the path in the given language, regardless of which language the path is in.
 */
export function route(path: string, lang: AvailableLanguageTag) {
	path = withoutLanguageTag(path)

	// Don't prefix the default language
	if (lang === sourceLanguageTag) return path

	// Prefix all other languages
	return `/${lang}${path}`
}

/**
 * Returns the path without the language tag
 */
function withoutLanguageTag(path: string) {
	const [_, maybeLang, ...rest] = path.split("/")
	if (availableLanguageTags.includes(maybeLang as AvailableLanguageTag)) {
		return `/${rest.join('/')}`
	}
	return path
}
```

We can now get the link to the current page in a different language by calling `route` with our current path. Using this link, a basic language switcher component looks like:

```svelte
<script lang="ts">
  import { availableLanguageTags } from "$paraglide/runtime";
  import { page } from "$app/stores";
  import { route } from "$lib/i18n-routing";
</script>

{#each availableLanguageTags as lang}
  <a href={route($page.url.pathname, lang)} hreflang={lang}>Change language to {lang}</a>
{/each}
```

If you don't want to use `<a>` tags, you can also use the `goto` function from `@sveltejs/kit` to navigate programmatically.

```svelte
<script lang="ts">
  import { availableLanguageTags } from "$paraglide/runtime";
  import { page } from "$app/stores";
  import { route } from "$lib/i18n-routing";
  import { goto } from "@sveltejs/kit";
</script>

{#each availableLanguageTags as lang}
  <button on:click={() => goto(route($page.url.pathname, lang))}>Change language to {lang}</button>
{/each}
```

## 6. SEO Considerations
On multi-language sites, it's easy to mess up your SEO. Here are a few things to keep in mind:

1. Set the `lang` attribute on your `<html>` tag. This will help search engines understand which language your site is in.
2. Add `hreflang` attributes to your `<a>` tags, unless it's the same language as the current page.
3. Link to all language versions of your page using `<link rel="alternate" hreflang="..." href="...">`. This will help search engines find all versions of your page.

Let's implement these things in our app.

### Setting the `lang` attribute

We need to set the `lang` attribute in two places. The Server, so that it will be correct on the first render, and the client, so that it stays correct when navigating between pages. Let's start with the server using [Sveltekit Hooks](https://kit.svelte.dev/docs/hooks).

We can set the `lang` attribute in `hooks.server.ts` by modifying the returned HTML. We can make this easier by making sure that the `lang` attribute has an easy-to-find placeholder. In `./src/app.html` add a placeholder for the `lang` attribute.

```html
<!-- ./src/app.html -->
<html lang="%lang%"></html>
```

Then in `hooks.server.ts`, replace the placeholder with the correct language.

```ts
// ./src/hooks.server.ts
import { sourceLanguageTag } from "$paraglide/runtime";

export async function handle({ event, resolve }) {
	const lang = event.params.lang ?? sourceLanguageTag

	return await resolve(event, {
		transformPageChunk({ done, html }) {
			//Only do it at the very end of the rendering process
			if (done) {
				return html.replace("%lang%", lang)
			}
		},
	})
}
```

If you now reload the page and inspect the HTML, you should see the correct `lang` attribute.

On the client, we can set the `lang` attribute using JS. In your root layout, add some code that reactively sets the `lang` attribute based on the route parameter.

```svelte
<script lang="ts">
  import { page } from "$app/stores";
  import { setLanguageTag, sourceLanguageTag, type AvailableLanguageTag } from "$paraglide/runtime";
  import { browser } from "$app/environment";

  //Use the default language if no language is given
  $: lang = $page.params.lang as AvailableLanguageTag ?? sourceLanguageTag;
  $: setLanguageTag(lang);

  //Set the lang attribute on the html tag
  $: if(browser) document.documentElement.lang = lang;
</script>
```

Now when you navigate change languages, the `lang` attribute should update.

> If you have a mix of `rtl` and `ltr` languages, you can use the exact same technique to set the `dir` attribute.

### Linking to alternate language versions

What we want is to generate a `<link rel="alternate" hreflang="..." href="...">` tag for each language version of the current page. Search Engines need this to differentiate between the different language versions of your page and to know which one to show to which user.

Fortunately, we already did most of the work for this when building the language switcher. We can reuse the `route` function to generate the correct `href` attribute.

Let's create a new `I18NHeader` component that generates the `<link>` tags. This component can be imported into your root layout to apply for all pages.

```svelte
<!-- ./src/lib/I18NHeader.svelte -->
<script lang="ts">
  import { availableLanguageTags } from "$paraglide/runtime";
  import { page } from "$app/stores";
  import { route } from "$lib/i18n-routing";
</script>

<svelte:head>
	{#each availableLanguageTags as lang}
		<link rel="alternate" hreflang={lang} href={route($page.url.pathname, lang)} />
	{/each}
</svelte:head>
```

> A page should link to itself, so we don't need to filter out the current language.

## What's next?

You are now ready to use Paraglide!

If you have any questions, feel free to ask them in our [Discord](https://discord.gg/gdMPPWy57R) or open a discussion on [GitHub](https://github.com/opral/monorepo/discussions).

You can view this example project on [GitHub](https://github.com/opral/monorepo/tree/main/inlang/source-code/paraglide/paraglide-js-adapter-sveltekit/example)

This guide is based on `paraglide-js 1.0.0-prerelease.12`, `plugin-message-format 2.0.0`, `m-function-matcher 0.5.0.` and `paraglide-js-adapter-vite 1.0.0-prerelease.2`.
