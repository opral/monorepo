# Manual Setup

The recommended way to set up `paraglide-sveltekit` is to use the `init` cli. However, we stil maintain a manual setup page in case the auotmated setup fails or cannot be used for some reason.

### 1. Install dependencies

Install [ParaglideJS](https://inlang.com/m/gerre34r/library-inlang-paraglideJs) and [Paraglide-SvelteKit](https://inlang.com/m/dxnzrydw/paraglide-sveltekit-i18n).

```bash
npx @inlang/paraglide-js init
npm i -D @inlang/paraglide-sveltekit
```

This will generate a `messages/{lang}.json` file for each of your languages. This is where your translation files live. 

### 2. Add the Vite Plugin 

Add the vite-plugin to your `vite.config.js` file. This will make sure to rerun the paraglide compiler when needed and add the link preprocessor.

```js
// vite.config.js
import { paraglide } from "@inlang/paraglide-sveltekit/vite"

export default defineConfig({
	plugins: [
		paraglide({
			//recommended
			project: "./project.inlang",
			outdir: "./src/lib/paraglide",
		}),
		sveltekit(),
	],
})
```

### 3. Initialise Paraglide-SvelteKit

Create a `src/lib/i18n.js` file:

```js
// src/lib/i18n.js
import { createI18n } from "@inlang/paraglide-sveltekit"
import * as runtime from "$lib/paraglide/runtime.js"

export const i18n = createI18n(runtime);
```

`createI18n` will be your one-stop shop for configuring i18n routing.

<doc-accordion
	heading="Does this need to be in src/lib/i18n.js ?"
	text="No. You can place this file anywhere. Be aware that you will be importing from here a lot, so make sure it's somewhere convenient.">
</doc-accordion>

### 4. Add the Language Provider to your Layout

Add the `ParaglideJS` component to your layout and pass it the `i18n` instance.

If you're using Svelte 4 do it like so: 
```svelte
<!-- src/routes/+layout.svelte -->
<script>
    import { ParaglideJS } from '@inlang/paraglide-sveltekit'
	import { i18n } from '$lib/i18n.js'
</script>

<ParaglideJS {i18n}>
    <slot />
</ParaglideJS>
```

or if you're using Svelte 5: 

```svelte
<!-- src/routes/+layout.svelte -->
<script>
    import { ParaglideJS } from '@inlang/paraglide-sveltekit'
	import { i18n } from '$lib/i18n.js'

	const { children } = $props()
</script>

<ParaglideJS {i18n}>
	{@render children}
</ParaglideJS>
```

### 5. Add the Hooks

In your `src/hooks.js` file, use the `i18n` instance to add the `reroute` hook:

```js
// src/hooks.js
import { i18n } from '$lib/i18n.js'
export const reroute = i18n.reroute()
```

> The reroute hook was added in SvelteKit 2.3.0

In `src/hooks.server.js` add the handle hook. 

```js
// src/hooks.server.js
import { i18n } from '$lib/i18n.js'
export const handle = i18n.handle()
```

This will make the language and text-direction on `event.locals.paraglide`.
To set the `lang` and `dir` attributes on your `<html>` tag add placeholders in `src/app.html`. These placeholders will be replaced by the `handle` hook.

```html
<!-- src/app.html -->
<html lang="%paraglide.lang%" dir="%paraglide.textDirection%"> 
```

### 6. Add Types for `event.locals.paraglide`

In `src/app.d.ts`

```ts
// src/app.d.ts
import type { AvailableLanguageTag } from "$lib/paraglide/runtime"
import type { ParaglideLocals } from "@inlang/paraglide-sveltekit"

declare global {
	namespace App {
		interface Locals {
			paraglide: ParaglideLocals<AvailableLanguageTag>
		}
		// ...
	}
}

export {}
```

## Go try it out!

Visit `/` to see your default language, and `/{lang}` to see other languages. All links should be translated automatically.

