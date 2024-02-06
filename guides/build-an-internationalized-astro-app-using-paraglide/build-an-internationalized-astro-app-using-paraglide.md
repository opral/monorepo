# Build an internationalized Astro App using Paraglide

In this Guide, we'll integrate the [ParaglideJs](/m/gerre34r/library-inlang-paraglideJs) i18n library into an Astro project. We'll use Paraglide to translate the page shell, aswell as some client side islands.

If you are looking to translate the _content_ of your app, you should check out the official [Astro i18n Recipie](https://docs.astro.build/en/recipes/i18n#_top). Astro does this very well out of the box. You only need an i18n library for the page-shell and client side components.


## Why Paraglide?

There is no shortage of i18n libraries for JavaScript, so why go with Paraglide? Paraglide offers some unique features that make it a great fit for Astro in particular.

When using Astro, usually only a small part of your app runs on the client. Consequently you usually only have a few messages that are needed on the client. If you were to use i18next, you would need to ship a 40kb runtime to the client, even if you only need to translate a few words. 

Paraglide avoids this in a few ways. First, it's runtime is tiny, usually less than 100 bytes. Second, it only ships the messages that are actually used on the client. Even if you have thousands of messages in your app, if your island only uses 10 of them, only those 10 will be shipped to the client. Paraglide's bundle scales to zero. 

Finally, Paraglide is fully typesafe. This means you get autocompletion on which messages are available, and on which arguments they take.

## Setup

We assume that you already have an Astro project set up. If you don't, you can follow the [official Astro Quickstart](https://docs.astro.build/en/install/auto/).

Start by setting up your routes so that each language (except the default) has it's own folder. For example:

```txt
├── src/
│   ├── pages/
│   │   ├── index.astro
│   │   ├── about.astro
│   │   ├── de/
│   │   │   ├── index.astro
│   │   │   ├── about.astro
│   │   ├── fr/
│   │   │   ├── index.astro
│   │   │   ├── about.astro
```

You can just author the content of each page in the correct language. You can also query content from `astro:content` by having language-specific collections. You will only be using Paraglide for translating the page shell and client side components.

Let's install Paraglide, and the Paraglide Astro Adapter.

```bash
npx @inlang/paraglide-js init
npm i @inlang/paraglide-js-adapter-astro
```

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
}
```

This integration will do a few things:
1. It will automatically run the Paraglide compiler when you run `npm run dev` or `npm run build`.
2. It will automatically run the Paraglide compiler when messages are changed.
3. It will set the language based on the URL, using middleware.

## Configuring Languages

You can tell Paraglide which languages are available, and which is the default language in `project.inlang/settings.json`. For example:

```json
{
    "languageTags": ["en", "de", "ar"],
    "sourceLanguageTag": "en",
}
```

Will make English the default language, and make German and Arabic available.

## Adding Messages

The default path for translation files is `./messages/{lang}.json`. You can change this option in `project.inlang/settings.json`. The Files just contain a Key-Value pair of the message ID and the message itself.

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

## Using Messages

After the compiler has run (should happen automatically if your dev server is running), you can import messages into your code by importing the `src/paraglide/messages.js` file. It's recommended to do a wildcard import.

```ts
import * as m from "../paraglide/messages.js"

m.hello_world() // Hello World
m.greeting({ name: "John" }) // Hello John
```

Each message is a function that returns the message in the current language. If the message requires parameters, typescript will enforce that you pass them in.

### Passing the Language to the Client

To save on bundle size,Paraglide doesn't ship language detection logic to the client. Instead it just reads the `lang` attribute on the `<html>` tag. Make sure this is set correctly when rendering on the server / statically. You should do this anyway for SEO reasons.

In your global Astro layout, add the following:
```tsx
---
import { languageTag } from "../paraglide/runtime.js"
---

<html lang={languageTag()}>
    <slot/>
</html>
```

That's it. The message functions will now return the correct language on the client and the server.

## Translating the Page Shell
Now it's really just a matter of going through your app and extracting any hard-coded strings into messages. This is easiest to do with the [inlang IDE Extension](https://inlang.com/m/r7kp499g/app-inlang-ideExtension).

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

## Translating Client Side Components

Now let's get to the main reason we are using Paraglide. We want to translate client side components.
Because all messages are separate functions, vite will be able to tree-shake them. This means that only the messages that are actually used on the client will be shipped to the client. This drastically reduces the bundle size & requires no extra work from you.

Let's translate an example `Counter.svelte` component.

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

We encourage you to run `npm run build` and inspect the output. You will see that only the message `m.count` is shipped to the client. Any other messages are not included in the bundle.

## What's Next?

You can read the [Paragldie](https://inlang.com/m/gerre34r/library-inlang-paraglideJs) and [Paraglide-Adapter-Astro](https://inlang.com/m/iljlwzfs/library-inlang-paraglideJsAdapterAstro) documentation to get a more complete understanding of what's possible. You can also check out our [Astro + Paraglide](https://stackblitz.com/~/github.com/LorisSigrist/paraglide-astro-example) example on StackBlitz.

If you have any suggestions for this guide, please reach out to us on [Discord](https://discord.gg/gdMPPWy57R), or open an issue on [GitHub](https://www.github.com/opral/monorepo/issues). If you have trouble following, don't hesitate to ask for help. We are happy to help getting you set up.
