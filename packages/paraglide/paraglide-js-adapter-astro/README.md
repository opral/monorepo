# Paraglide Adapter Astro

This Astro Integration makes it trivial to use Paraglide in your Astro project. It hooks paraglide into astro's own i18n routing.

## Features
- 🏝️ Only messages used on islands get shipped to the client.
- 📦 Fully Typesafe messages, params and all
- 🤏 Tiny runtime (<100 bytes)
- 💨 A breeze to set up - No need to change your `pages/` folder

Paraglide is a _compiler_ for your messages.

## Installation

```bash
npx @inlang/paraglide-js init
npm i @inlang/paraglide-js-adapter-astro
```

Register the Integration in `astro.config.mjs`:

```js
import paraglide from '@inlang/paraglide-js-adapter-astro'

export default {
  integrations: [
    paraglide({
      //recommended setup
      project: "./project.inlang", 
      outdir: "./src/paraglide", //where the message files will be placed
    }),
  ],
}
```

## Usage

### Adding & using messages
Messages are placed in `messages/{lang}.json`. 

```json
// messages.en.json
{
  "hello": "Hello {name}!"
}
```

Declare which languages you support in `project.inlang/settings.json`.

```json
{
  "languageTags": ["en", "de"],
  "sourceLanguageTag": "en",
}
```

You can use messages like so:

```markdown
---
import * as m from "../paraglide/messages.js";
---

<h1>{m.hello({ name: "Samuel" })}</h1>
```

Vite is able to tree-shake the messages. Only messages that are used on an Island will be included in the client bundle. This drastically reduces the bundle size & requires no extra work from you.

### Which language get's used

The integration automatically sets the language based on the URL. You can set the language for a given page by placing it in a folder with the language code as the name:

```filesystem
src
├── pages
│   ├── en
│   │   ├── index.astro
│   │   └── about.astro
│   └── de
│       ├── index.astro
│       └── about.astro
```

If a page isn't in a language folder, it will use the default language.

```filesystem
src
├── pages
│   ├── index.astro // default language
│   ├── about.astro // default language
│   └── de
│       ├── index.astro // de
│       └── about.astro // de
```

You can configure which languages are available, and which is the default language in `project.inlang/settings.json`. 

To save bundle size on the client, the integration doesn't ship language detection code to the client. Instead, it will read the `lang` attribute on the `<html>` tag & trust that. Make sure it is set correctly.

```astro
//src/layouts/default.astro
---
import { languageTag } from "$paraglide/runtime";
---

<!doctype html>
<html lang={languageTag()}>
    <slot />
</html>
---
```

You can also access the current language and text-direction via `Astro.locals.paraglide.lang` and `Astro.locals.paraglide.dir` respectively.


### Adding Alternate Links

For SEO reasons, you should add alternate links to your page's head that point to all translations of the current page. Also include the _current_ page. 

```html
<head>
    <link rel="alternate" hreflang="en" href="/en/about" />
    <link rel="alternate" hreflang="de" href="/de/ueber-uns" />
</head>
```

Since only you know which pages correspond to each other this needs to be done manually.

## Roadmap
- Support [Astro's i18n-paths](https://docs.astro.build/en/reference/configuration-reference/#i18nlocales) (eg. use `/en` as `/english`)
- Improve Server-Rendering support

## Playground

Check out an example Astro project with Paraglide integration on [StackBlitz](https://stackblitz.com/~/github.com/LorisSigrist/paraglide-astro-example)