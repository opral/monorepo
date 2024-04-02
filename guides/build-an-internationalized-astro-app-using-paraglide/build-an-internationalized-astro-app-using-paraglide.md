# Build an internationalized Astro App

In this guide, we will be learning how to build an multilingual Astro.

Astro comes with [great internationalization out of the box](https://docs.astro.build/en/recipes/i18n/). It makes it very easy to translate the content of our pages.

For stuff that's shared between pages, such as layouts or components, we still need an i18n library to inject the correct messages. We'll be using [ParaglideJS](/m/gerre34r/library-inlang-paraglideJs). 

[Paraglide](/m/gerre34r/library-inlang-paraglideJs) offers some unique features that make it a great fit for Astro
- Only messages that are used on 🏝️Islands are shipped to the client
- Fully typesafe
- Tiny runtime (<100bytes on the client)

## Setup

Set up an Astro app with:

```bash
pnpm create astro@latest
```

Then set up [Astro i18n](https://docs.astro.build/en/recipes/i18n/) in `astro.config.mjs`:

```ts
export default defineConfig({
	i18n: {
		defaultLocale: "en", // the default locale
		locales: ["en", "de"] // the locales you want to support
	},
})
```

This doesn't affect the routing in any way, but it describes which paths will have which language.
- `/*` will use the default language (english)
- `/en/*` will use english
- `/de/*` will use german 

Let's set up our routes to match that:

```fs
├── src/
│   ├── pages/
│   │   ├── index.astro //default language
│   │   ├── about.astro //default language
│   │   ├── de/
│   │   │   ├── index.astro //german
│   │   │   ├── about.astro//german
```

It's easiest to author content directly in these files.

If you are using the `content/` directory, you should set up different collections for each langauge. Follow the [Astro i18n recipie](https://docs.astro.build/en/recipes/i18n/#use-collections-for-translated-content) to do so.  

Inside `.astro` files, we can access the current language with `Astro.currentLocale`. We can use this to query content in the correct language.

## Adding ParaglideJS

For translating layouts and components we need an i18n library. Let's install [ParaglideJS](https://inlang.com/m/gerre34r/library-inlang-paraglideJs) and the [Paraglide Astro Integration](https://inlang.com/m/iljlwzfs/paraglide-astro-i18n).

```bash
npx @inlang/paraglide-js init
npm i @inlang/paraglide-js-adapter-astro
```

This will have genrated all the files needed for Paraglid & added the necessary dependencies.

Then register the Integration in your `astro.config.mjs`:

```js
import paraglide from '@inlang/paraglide-js-adapter-astro'

export default {
  integrations: [
    paraglide({
      project: "./project.inlang",
      outdir: "./src/paraglide",
    }),
  ],
  i18n: {
    defaultLocale: "en",
    locales: ["en", "de"],
  }
}
```

This integration will do a few things:
1. Run the Paraglide compiler when you run `npm run dev` or `npm run build`.
2. Run the Paraglide compiler when messages are changed.
3. Set Paraglide's language based on your astro i18n routing config.

You need to tell Paraglide which languages are available, and which is the default language in `project.inlang/settings.json`. 

```json
{
    "languageTags": ["en", "de"],
    "sourceLanguageTag": "en",
}
```

> Paraglide is a compiler that runs outside of your dev server, so it unfortunately can't just read the i18n config from `astro.config.mjs`. Oh well...

### Adding Messages

Messages are located in `./messages/{lang}.json`. You can change this in `project.inlang/settings.json`. The files contain a key-calue pair of the message ID and the message itself.

```json
// messages/en.json
{
	"$schema": "https://inlang.com/schema/inlang-message-format",
	"hello_world": "Hello World",
	"greeting": "Hello {name}"
}
```

If you already have a lot of hardcoded text in your app you should use the [Sherlock VS Code extension](https://inlang.com/m/r7kp499g/app-inlang-ideExtension) to extract them automatically.

## Using Messages

You can import messages from `src/paraglide/messages.js`. It's recommended to do a wildcard import.

```ts
import * as m from "../paraglide/messages.js"

m.hello_world() // Hello World
m.greeting({ name: "John" }) // Hello John
```

Each message is a function that returns the message in the current language. If the message requires parameters, typescript will enforce that you pass them in.

### Passing the Language to the Client

To save bundle size, Paraglide doesn't ship language detection logic to the client. Instead it just reads the `lang` attribute on the `<html>` tag. Make sure this is set correctly. 

In your global Astro layout, add the following:
```tsx
<html lang={Astro.currentLocale}>
    <slot/>
</html>
```

## Translating the Page Shell

Now it's really just a matter of going through your app and extracting any hard-coded strings into messages. This is easiest to do with the [Sherlock VSCode extension](https://inlang.com/m/r7kp499g/app-inlang-ideExtension).

Then you just import the messages and use them in your components. 

```html
---
import * as m from "../paraglide/messages.js"
---

<aside>
    <nav>
        <a href="/">{m.home()}</a>
        <a href="/about">{m.about()}</a>
    </nav>
</aside>

```

## Translating Components

Let's translate an example `Counter.svelte` component.

You use messages in components the same way you use messages in layouts. By importing from `src/paraglide/messages.js`.

```svelte
<sciprt>
  import * as m from "../paraglide/messages"

  let count = 0; 

  function increment() {
    count += 1;
  }
</script>

<div>
    <span>{m.count({ count })}</span>
    <button on:click={increment}>+</button>
</div>
```

Since all messages are separate exports, Vite will be able to treeshake them. Only messages that are _used_ in hydrated components will be sent to the client. This drastically reduces bundle size & requires no extra work.

In components you can access the current language using the `languageTag()` function.

```svelte
<sciprt>
  import { languageTag } from "../paraglide/runtime"
</script>

<h1>{languageTag()}</h1>
```

## What's Next?

You can read the [Paraglide](https://inlang.com/m/gerre34r/library-inlang-paraglideJs) and [Paraglide-Adapter-Astro](https://inlang.com/m/iljlwzfs/paraglide-astro-i18n) documentation to get a more complete understanding of what's possible. You can also check out our [Astro + Paraglide](https://stackblitz.com/~/github.com/LorisSigrist/paraglide-astro-example) example on StackBlitz.

If you have any suggestions for this guide, please reach out to us on [Discord](https://discord.gg/CNPfhWpcAa), or open an issue on [GitHub](https://www.github.com/opral/inlang-paraglide-js/issues). If you have trouble following, don't hesitate to ask for help. We are happy to help getting you set up.
