---
title: "Getting Started"
description: "Learn how to install the ParaglideJS i18n library in your project"
---
[![Inlang-ecosystem compatibility badge](https://cdn.jsdelivr.net/gh/opral/monorepo@main/inlang/assets/md-badges/inlang.svg)](https://inlang.com)

# Getting started

To use Paraglide standalone without a framework, run the following command:

```bash
npx @inlang/paraglide-js@latest init
```

This will:

- Install necessary dependencies
- Generate a `messages/` folder where your translation files live
- Add the Paraglide compiler to your `build` script in `package.json`
- Create necessary configuration files

Running the Paraglide compiler will generate a `src/paraglide` folder. This folder contains all the code that you will use in your app.

## Adding and Editing Messages

Messages are stored in `messages/{lang}.json` as key-value pairs. You can add parameters with curly braces.

```diff
// messages/en.json
{
	"$schema": "https://inlang.com/schema/inlang-message-format",
+ 	"greeting": "Hello {name}!"
}
```

Make sure to re-run the paraglide compiler after editing your messages.

```bash
npx @inlang/paraglide-js compile --project ./project.inlang --outdir ./src/paraglide
```

If you are using a Bundler use one of the [Bundler Plugins](usage#usage-with-a-bundler) to recompile automatically.

## Using Messages in Code

After running the compiler import the messages with `import * as m from "./paraglide/messages"`. By convention, a wildcard import is used.

```js
import * as m from "./paraglide/messages.js"
import { setLanguageTag } from "./paraglide/runtime.js"

m.hello() // Hello world!
m.loginHeader({ name: "Samuel" }) // Hello Samuel, please login to continue.
```

# Playground

Find examples of how to use Paraglide on CodeSandbox or in [our GitHub repository](https://github.com/opral/monorepo/tree/main/inlang/source-code/paraglide).

<doc-links>
    <doc-link title="NextJS + Paraglide JS" icon="lucide:codesandbox" href="https://stackblitz.com/~/LorisSigrist/paraglide-next-app-router-example" description="Play around with NextJS and Paraglide JS"></doc-link>
    <doc-link title="Svelte + Paraglide JS" icon="lucide:codesandbox" href="https://stackblitz.com/~/github.com/LorisSigrist/paraglide-sveltekit-example" description="Play around with Svelte and Paraglide JS"></doc-link>
    <doc-link title="Astro + Paraglide JS" icon="lucide:codesandbox" href="https://stackblitz.com/~/github.com/LorisSigrist/paraglide-astro-example" description="Play around with Astro and Paraglide JS"></doc-link>
</doc-links>

# Roadmap

Of course, we're not done yet! We plan on adding the following features to Paraglide JS soon:

- [ ] Pluralization ([Join the Discussion](https://github.com/opral/monorepo/discussions/2025))
- [ ] Formatting of numbers and dates ([Join the Discussion](https://github.com/opral/monorepo/discussions/992))
- [ ] Markup Placeholders ([Join the Discussion](https://github.com/opral/monorepo/discussions/913))
- [ ] Component Interpolation
- [ ] Per-Language Splitting without Lazy-Loading 
- [ ] Even Smaller Output

# Talks

- [Svelte Summit Spring 2023](https://www.youtube.com/watch?v=Y6IbPfMU1xM)
- [Svelte Summit Fall 2023](https://www.youtube.com/watch?v=-YES3CCAG90)
- Web Zurich December 2023
- [Svelte London January 2024](https://www.youtube.com/watch?v=eswNQiq4T2w&t=646s)
