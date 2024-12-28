# Build a global [SvelteKit](https://kit.svelte.dev) app

In this guide, we will be creating a simple SvelteKit app with localised routing, using Paraglide for translations.

We will be using [Paraglide-Sveltekit](https://inlang.com/m/dxnzrydw/paraglide-sveltekit-i18n) i18n library and the [Sherlock](https://inlang.com/m/r7kp499g/app-inlang-ideExtension) VS Code extension.

Paraglide-SvelteKit is a great choice for SvelteKit. It's fully typesafe and comes with localised routing and link translations out of the box.

## 1. Create a SvelteKit app

Set up a SvelteKit app as you normally would. If you need help, check out the [SvelteKit documentation](https://kit.svelte.dev/docs/creating-a-project).

```bash
npm create svelte@latest my-app
cd my-app
```

## 2. Initialize Paraglide-SvelteKit

Run the following command in your project root to initialize Paraglide-SvelteKit.

```bash
npx @inlang/paraglide-sveltekit init
npm install
```

The CLI will ask you which languages you intend to support. Don't worry, this can be changed later.

## 3. Adding and Using Messages

### Adding Messages

The init command will have generated `./messages/{lang}.json` files for each language. This is where your messages live. The files contain a key-value pair of the message-key and the message itself.

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
2. Using the [Sherlock (VS Code extension)](https://inlang.com/m/r7kp499g/app-inlang-ideExtension)

### Add messages through Sherlock (recommended)

First, install the Sherlock VS Code extension from the [vs-code marketplace](https://marketplace.visualstudio.com/items?itemName=inlang.vs-code-extension).

Once you have the extension installed, select a hard-coded string with your cursor, hit `⌘ + .` and use the `Sherlock: Extract` action. Give the message an ID and hit enter.

This extracts the hard-coded string and places it into the translation file of the default language. No need to even look at the file!

### Using Messages in Code

Import messages from `$lib/paraglide/messages`. By convention we do a wildcard import as `m`.

```ts
import * as m from "$lib/paraglide/messages";

m.hello_world(); // Hello World
m.greeting({ name: "John" }); // Hello John
```

Each message is a function that returns the message in the current language. If the message requires parameters, typescript will enforce that you pass them in.

### 4. Localised Routing

Paraglide-SvelteKit uses the URL to determine which language to use. If the first part of the path is a language, that langauge will be used. Otherwise the default language will be used.

- `/about` → english (default language)
- `/de/about` → german

Creating a route for eacht language & updating all your links to include the language tag is tedious. For this reason Paraglide-SvelteKit comes with localised routing out of the box.

Requests to `/de/about` will render the page at `src/routes/about/+page.svelte` by default. You don't need to add a `[locale]` parameter. Additionally, internal links like `<a href="/about">About</a>` are automatically rewritten to include the current language.

```svelte
<a href="/about">About</a>

<!-- will render as -->
<a href="/de/about">Über uns</a>
<!-- if current language is German -->
```

You can specify which language a link points to by setting the `hreflang` attribute.

```svelte
<a href="/about" hreflang="de">Über uns</a>
<!-- will render as -->
<a href="/de/about" hreflang="de">Über uns</a>
<!-- regardless of the current language -->
```

This makes localised routing much less of a pain.

## 5. Adding a language switcher

Language switchers are challenging, because they require us to dynamically translate the path we're currently on. We can do this by first removing the language tag from the current path, and then adding it back in the correct language.

Paraglide-SvelteKit provides convenient functions for this. `i18n.route(translatedPath)`.

```svelte
<script lang="ts">
  import { availableLanguageTags } from "$lib/paraglide/runtime";
  import { page } from "$app/stores";
  import { i18n } from "$lib/i18n.js";

  $: currentPathWithoutLanguage = i18n.route($page.url.pathname)
</script>

{#each availableLanguageTags as lang}
  <a
  	href={currentPathWithoutLanguage}
	hreflang={lang}>Change language to {lang}</a>
{/each}
```

## What's next?

Paraglide-SvelteKit has a few more features that you might want to check out, such as localized paths. Read more about it in the [Paraglide-SvelteKit Documentation](https://inlang.com/m/dxnzrydw/paraglide-sveltekit-i18n).

[Checkout the example GitHub](https://github.com/opral/monorepo/tree/main/inlang/packages/paraglide/paraglide-sveltekit/example) or on [StackBlitz](https://stackblitz.com/~/github.com/lorissigrist/paraglide-sveltekit-example)

If you have any questions, feel free to ask them in our [Discord](https://discord.gg/CNPfhWpcAa) or open a discussion on [GitHub](https://github.com/opral/monorepo/discussions).
