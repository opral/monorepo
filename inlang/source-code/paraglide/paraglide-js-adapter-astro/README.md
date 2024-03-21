# Paraglide Adapter Astro

This Integration makes it trivial to use [ParaglideJS](https://inlang.com/m/gerre34r/library-inlang-paraglideJs) to internationalize your Astro project.

**Features**

- 🏝️ Only messages used on islands get shipped to the client.
- 🛟 Fully Typesafe messages, params and all
- 🤏 Tiny runtime (<100 bytes)
- 📦 Integrates with Astro's i18n routing

This integration doesn't do routing. It simply reads the language from [Astro's built in i18n routing](https://docs.astro.build/en/guides/internationalization/) & sets the language for [Paraglide](https://inlang.com/m/gerre34r/library-inlang-paraglideJs).

[Paraglide](https://inlang.com/m/gerre34r/library-inlang-paraglideJs) is a compiler for your messages. It generates _type-safe_, _tree-shakeable_ message functions. This way messages are only shipped to the client if messages are used on islands.

## Installation

```bash
npx @inlang/paraglide-js init
npm i @inlang/paraglide-js-adapter-astro
```

Register the Integration in `astro.config.mjs`:

```js
import paraglide from "@inlang/paraglide-js-adapter-astro"

export default {
	integrations: [
		paraglide({
      // recommended settings
			project: "./project.inlang",
			outdir: "./src/paraglide", //where your files should be
		}),
	],

	// you can, but don't have to, use astro's i18n routing
  // Everything including paths just works
	i18n: {
		locales: [
			"en",
			{ code: "de", path: "deutsch" },
		],
		defaultLocale: "en",
	},
}
```

## Usage

### Adding & using messages

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
	"sourceLanguageTag": "en"
}
```

Use messages like so:

```markdown
---
import * as m from "../paraglide/messages.js";
---

<h1>{m.hello({ name: "Samuel" })}</h1>
```

Vite is able to tree-shake the messages. Only messages that are used on an Island will be included in the client bundle. This drastically reduces the bundle size & requires no extra work from you.

### Which language get's used

The integration detects the language from the URL. Simply place your page in a folder named for the language (or the `path` of the language) & all messages will be in that language.

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

To save bundle size the integration doesn't ship language detection code to the client. Instead, it will read the `lang` attribute on the `<html>` tag. Make sure it is set correctly.

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

- Improved Server-Rendering support

## Playground

Check out an example Astro project with Paraglide integration on [StackBlitz](https://stackblitz.com/~/github.com/LorisSigrist/paraglide-astro-example)
