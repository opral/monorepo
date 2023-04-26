---
title: SDK for SvelteKit
href: /documentation/sdk/sveltekit
description: i18n SDK designed and fully integrated for SvelteKit.
---

{% Figure

    src="https://user-images.githubusercontent.com/11630812/114088279-7cd7be80-98d2-11eb-883c-66c3bf48f293.png"

    alt="SvelteKit Header"

/%}

# {% $frontmatter.title %}

inlang provides an SDK that integrates seamlessly with SvelteKit.

## Getting Started

1. Add `@inlang/sdk-js/adapter-sveltekit` dependency to your project

   ```js
   // using npm
   npm install -D @inlang/sdk-js/adapter-sveltekit

   // using yarn
   yarn add -D @inlang/sdk-js/adapter-sveltekit
   ```

2. Add the inlang plugin to the `plugins` section of `vite.config.js`

   ```js
   import { inlangPlugin } from "@inlang/sdk-js/adapter-sveltekit"

   export default defineConfig({
   	plugins: [sveltekit(), inlangPlugin.vite()],
   })
   ```

That's it. You have now completed the setup and can output Messages everywhere in your SvelteKit project.

## Usage

Wherever you want to output a message, you can use the [inlang-function](/documentation/sdk/usage#inlang-function) function.

```svelte
<script>
  import { i } from '@inlang/sdk-js'
</script>

<h1>{i('welcome')}</h1>
```

Take a look at the [Usage](/documentation/sdk/usage) to learn more about how to use inlang in your project.

## Configuration

You can configure the inlang SDK depending on your needs. You can learn more in the [Configuration](/documentation/sdk/configuration) section.
