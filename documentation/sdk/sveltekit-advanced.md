---
title: SDK for SvelteKit - Advanced Usage
href: /documentation/sdk/sveltekit-advanced
description: i18n SDK designed and fully integrated for SvelteKit.
---

# {% $frontmatter.title %}

The SDK sets up everything automatically you need in order to make your application support multiple languages. Currently only a basic feature set is supported, but we are working on adding more features in the coming weeks.

It may be the case that you encounter a bug or reach a point where our automations fall over. In that case you can always opt out of the magic the SDK provides and manually write the code yourself. This makes sure you are not blocked by the SDK and can continue working on your project.

In order to opt-out of the SDK magic, just add the following import anywhere in your file:

```js
import '@inlang/sdk-js/no-transforms'
```

By adding this line, the code in that file will not be transformed and you need to make sure you manually add the necessary functionality.

Here are some examples of what you need to do:

## Required Setup

Those files require to be set up if you want to use any functionality of the SDK

### `hooks.server.js`

You need to wrap the `handle` function in order to setup the inlang SDK.

```ts
import '@inlang/sdk-js/no-transforms'
import { initHandleWrapper } from '@inlang/sdk-js/adapter-sveltekit/server'

export const handle = initHandleWrapper({
	// ... see TypeScript definition or source code for all parameters
}).use(({ resolve, event }) => {

	// your code goes here

	return resolve(event)
})
```

### `/routes/+layout.server.js` (root server layout)

You need to wrap the `load` function in your root server layout in order to setup the inlang SDK.

```ts
import '@inlang/sdk-js/no-transforms'
import { initRootLayoutServerLoadWrapper } from '@inlang/sdk-js/adapter-sveltekit/server'
import type { LayoutServerLoad } from "./$types.js"

export const load = initRootLayoutServerLoadWrapper<LayoutServerLoad>().use(() => {

	// your code goes here

	return {
		// ...
	}
})
```

### `/routes/+layout.js` (root layout)

You need to wrap the `load` function in your root layout in order to setup the inlang SDK.

```ts
import '@inlang/sdk-js/no-transforms'
import { initRootLayoutLoadWrapper } from '@inlang/sdk-js/adapter-sveltekit/shared'
import type { LayoutLoad } from "./$types.js"

export const load = initRootLayoutLoadWrapper<LayoutLoad>({
	// ... see TypeScript definition or source code for all parameters
}).use(() => {

	// your code goes here

	return {
		// ...
	}
})
```

### `/routes/+layout.server.js` (root svelte layout)

You need to call a few functions in your root svelte layout file in order to setup the inlang SDK.

```svelte
<script>
	import '@inlang/sdk-js/no-transforms'
	import { browser } from '$app/environment'
	import {
		addRuntimeToContext,
		getRuntimeFromContext
	} from '@inlang/sdk-js/adapter-sveltekit/not-reactive'
	import { getRuntimeFromData } from '@inlang/sdk-js/adapter-sveltekit/shared'
	import type { LayoutData } from "./$types.js"

	export let data: LayoutData

	addRuntimeToContext(getRuntimeFromData(data))
	let { language } = getRuntimeFromContext()

	$: if (browser) {
		addRuntimeToContext(getRuntimeFromData(data))
		({ language } = getRuntimeFromContext())
	}
</script>

{#key language}
	{#if language}

		<!-- your code goes here -->

		<slot />

	{/key}
{/if}
```

## Usage of the SDK

If you want to use an import from the SDK inside a file where you have opted out of the SDK magic, you need to use it like this:

> The examples always show the usage of the [inlang function (`i`)](https://inlang.com/documentation/sdk/usage) from the SDK. You can use any other import from the SDK in the same way.

### `*.svelte`

```svelte
<script>
	import '@inlang/sdk-js/no-transforms'
	import { getRuntimeFromData } from '@inlang/sdk-js/adapter-sveltekit/shared'

	const  { i } = getRuntimeFromContext()
</script>

<h2>
	{i('welcome', { name: 'inlang' })}
</h2>
```

### `*.js` (called from a .svelte file)

```ts
import '@inlang/sdk-js/no-transforms'
import { getRuntimeFromData } from '@inlang/sdk-js/adapter-sveltekit/shared'

const getPageTitle = (page: string) => {
	const  { i } = getRuntimeFromContext()

	return i(`title.${page}`)
}
```

### `*.js` (called from a +*.js file on the server)

You need to pass the `i` function to the function you want to call it from.

```ts
import '@inlang/sdk-js/no-transforms'
import type { InlangFunction } from "@inlang/sdk-js/runtime"

const getPageTitle = (i: InlangFunction, page: string) => {
	return i(`title.${page}`)
}
```

### `+layout.server.js`

The first parameter of the `use` function is the Event you usually get on a `load` function. You can access any import from the SDK through the second parameter.

```ts
import '@inlang/sdk-js/no-transforms'
import { initLayoutServerLoadWrapper } from '@inlang/sdk-js/adapter-sveltekit/server'
import type { LayoutServerLoad } from "./$types.js"

export const load = initLayoutServerLoadWrapper<LayoutServerLoad>().use(({ params }, { i }) => {
	return {
		id: params.id,
		title: i('title', { name: 'inlang' }),
	}
})
```

> You need to replace `initLayoutServerLoadWrapper` with `initRootLayoutServerLoadWrapper` of it is your root server layout file.

### `+layout.js`

The first parameter of the `use` function is the Event you usually get on a `load` function. You can access any import from the SDK through the second parameter.

```ts
import '@inlang/sdk-js/no-transforms'
import { initLoadWrapper } from '@inlang/sdk-js/adapter-sveltekit/shared'
import type { LayoutLoad } from "./$types.js"

export const load = initLoadWrapper<LayoutLoad>().use(({ params }, { i }) => {
	return {
		id: params.id,
		title: i('title', { name: 'inlang' }),
	}
})
```

> You need to replace `initLoadWrapper` with `initRootLayoutLoadWrapper` of it is your root layout file.

### `+page.server.js`

The first parameter of the `use` function is the Event you usually get on a `load` function. You can access any import from the SDK through the second parameter.

```ts
import '@inlang/sdk-js/no-transforms'
import { initPageServerLoadWrapper } from '@inlang/sdk-js/adapter-sveltekit/server'
import type { PageServerLoad } from "./$types.js"

export const load = initPageServerLoadWrapper<PageServerLoad>().use(({ params }, { i }) => {
	return {
		id: params.id,
		title: i('title', { name: 'inlang' }),
	}
})
```

> You need to replace `initPageServerLoadWrapper` with `initRootPageServerLoadWrapper` of it is your root server page file.

### `+page.js`

The first parameter of the `use` function is the Event you usually get on a `load` function. You can access any import from the SDK through the second parameter.

```ts
import '@inlang/sdk-js/no-transforms'
import { initLoadWrapper } from '@inlang/sdk-js/adapter-sveltekit/shared'
import type { PageLoad } from "./$types.js"

export const load = initLoadWrapper<PageLoad>().use(({ params }, { i }) => {
	return {
		id: params.id,
		title: i('title', { name: 'inlang' }),
	}
})
```

> You need to replace `initLoadWrapper` with `initRootPageLoadWrapper` of it is your root page file.