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

The init command will have generated `./messages/{lang}.json` files for each language. This is where your messages live. The Files contain a Key-Value pair of the message ID and the message itself.

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
2. Using [Sherlock (VS Code extension)](https://inlang.com/m/r7kp499g/app-inlang-ideExtension)

### Add messages through Sherlock (VS Code extension) - recommended

- Install the Sherlock (VS Code extension) from the VS Code marketplace.
  [See extension on inlang.com](https://inlang.com/m/r7kp499g/app-inlang-ideExtension)
  [vs-code marketplace](https://marketplace.visualstudio.com/items?itemName=inlang.vs-code-extension)

- Reload window (only needed once).
  `⌘ or Ctrl` + `Shift` + `P` -> Developer: Reload Window. On the bottom it should display for some seconds after relaod: `inlang's extension activated`.

- Select a hard-coded string, for example, on the About page. Mark the string with your cursor and hit `command` + `.` -> Inlang: Extract
  message. Give the message an ID and hit enter.

- This command extracts the hard-coded string and places it into the source language translation file `en.json` in the `messages` directory.

### Using Messages in Code

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


### 4.1 Adding the Vite Plugin

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

### 4.2 Initializing the Adapter

To initialize the Adapter, we need to call `createI18n` and pass it the paraglide runtime. We can do this in a new file, for example `./src/lib/i18n.ts`.

```ts
// ./src/lib/i18n.ts
import { createI18n } from "@inlang/paraglide-js-adapter-sveltekit"
import * as runtime from "$paraglide/runtime"

export const i18n = createI18n(runtime)
```

### 4.3 Adding the Adapter Component to your Layout

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


### 4.4 Adding the Hooks

The last thing you need is to set up the `reroute` hook in `src/hooks.js`. Again, the `i18n` instance has you covered.

```ts
// ./src/hooks.js
import { i18n } from "$lib/i18n"
export const reroute = i18n.reroute()
```

> This requires SvelteKit Version 2.3 or higher. Please upgrade if you are using an older version.


### 4.5 Try it out

You should now have i18n routing set up in your App. Try it out by navigating to `/en` and `/de` (or whatever languages you have set up). Navigating to `/` should give you the default language.

You will also notice that any internal links, like `<a href="/about">About</a>` will be rewritten to include the current language tag. You can change which language a link points to by setting the `hreflang` attribute. 

```svelte
<a href="/about" hreflang="de">Über uns</a>
```

## 5. Adding a language switcher

Language switchers are challenging, because they require us to dynamically translate the path we're currently on. We can do this by first removing the language tag from the path, and then adding it back in the correct language.

The Adapter provides convenient functions for this. `i18n.route(translatedPath)`.

```svelte
<script lang="ts">
  import { availableLanguageTags } from "$paraglide/runtime";
  import { page } from "$app/stores";
  import { i18n } from "$lib/i18n.js";
</script>

{#each availableLanguageTags as lang}
  <a 
  	href={i18n.route($page.url.pathname)} 
	hreflang={lang}>Change language to {lang}</a>
{/each}
```

## 6. SEO Considerations

Most SEO considerations are handled automatically by the Adapter.

1. The Adapter will add `rel="alternate"` link tags to your `<head>` for SEO purposes.
2. The Adapter encourages you to use the `hreflang` attribute on your `<a>` tags.

The only thing left to do is to set the `lang` attribute on your `<html>` tag. This is important for search engines, and also for screen readers.

Here too the Adapter has you covered. It exposes a `handle` function that you can use to modify the HTML before it is sent to the client. We can use this to set the `lang` attribute.

First, add an easy-to-find placeholder for the `lang` attribute in `./src/app.html`. By default the hook is looking for `%paraglide.lang%`.

```html
<!-- ./src/app.html -->
<html lang="%paraglide.lang%" dir="%paraglide.dir%"></html>
```

Then in `hooks.server.ts`, register the `handle` function.

```ts
// ./src/hooks.server.ts
import { i18n } from "$lib/i18n";
export const handle = i18n.handle();
```

That's it! If you now reload the page and inspect the HTML, you should see the correct `lang` attribute.

## What's next?

You are now set up with a multi-linguagal SvelteKit app using Paraglide!

The SvelteKit adapter has a few more features that you might want to check out, such as localized paths. Read more about it in the [SvelteKit Adapter Documentation](https://inlang.com/m/dxnzrydw/paraglide-sveltekit-i18n).

Try it on [StackBlitz](https://stackblitz.com/~/github.com/lorissigrist/paraglide-sveltekit-example)

If you have any questions, feel free to ask them in our [Discord](https://discord.gg/CNPfhWpcAa) or open a discussion on [GitHub](https://github.com/opral/monorepo/discussions).

You can reference an example project on [GitHub](https://github.com/opral/monorepo/tree/main/inlang/source-code/paraglide/paraglide-js-adapter-sveltekit/example).

This guide is based on `paraglide-js 1.1.0`, `paraglide-js-adapter-sveltekit 0.1.0`, `plugin-message-format 2.0.0`, `m-function-matcher 0.5.0.` and `paraglide-js-adapter-vite 1.0.0-prerelease.2`.
