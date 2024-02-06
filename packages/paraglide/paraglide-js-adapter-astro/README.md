# Paraglide Adapter Astro

This package provides an Astro Integration making it trivial to use Paraglide in your Astro project. It is purpousefully narrow in scope. It manages the language state and integrates with the Paraglied compiler. It does not provide routing utilities or UI components.

## Installation

```bash
npx @inlang/paraglide-js init
npm i @inlang/paraglide-js-adapter-astro
```

Then register the Integration in your `astro.config.mjs`:

```js
import paraglide from '@inlang/paraglide-js-adapter-astro'

export default {
  integrations: [
    //this will automatically set the language based on the URL
    paraglide({
      project: "./project.inlang",
      outdir: "./src/paraglide",
    }),
  ],
}
```

## Usage

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

To save bundle size on the client, the integration doesn't ship language detection code to the client. Instead, it will read the `lang` attribute on the `<html>` tag & trust that. Make sure it is set correctly when rendering on the server / statically.

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

### Using Messages

You can import messages from the generated `paraglide` folder like so:

```astro
---
import * as m from "../paraglide/messages.js";
---

<h1>{m.hello_world()}</h1>
```

You can do this both in `.astro` files, `.js` files and any other file type that Astro supports.

You will notice that each message is it's own export. This allows vite to tree-shake the messages. If you use messages on an Island, only the messages used on that Island will be included in the client bundle. This drastically reduces the bundle size & requires no extra work from you.

### (optional) Setting up an Alias

You will be importing from the generated `paraglide` folder a lot. To make this easier, you can set up an alias to it in your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "$paraglide/*": ["./src/paraglide/*"]
    }
  }
}
```

Make sure `baseUrl` is also set.

This will allow you to import messages like so: 
    
```astro
---
import * as m from "$paraglide/messages.js";
---

<h1>{m.hello_world()}</h1>
```

## Playground

Check out an example Astro project with Paraglide integration on [StackBlitz](https://stackblitz.com/~/github.com/LorisSigrist/paraglide-astro-example)