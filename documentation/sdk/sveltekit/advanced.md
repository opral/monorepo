---
title: Globalization SDK for SvelteKit - Advanced Usage
shortTitle: SvelteKit (Advanced)
href: /documentation/sdk/sveltekit/advanced
description: i18n SDK designed and fully integrated for SvelteKit.
---

# {% $frontmatter.title %}

The SDK sets up everything automatically you need in order to make your application support multiple languages. Currently only a basic feature set is supported, but we are working on adding more features in the coming weeks.

It may be the case that you encounter a bug or reach a point where our automations fall over. In that case you can always opt out of the magic the SDK provides and manually write the code yourself. This makes sure you are not blocked by the SDK and can continue working on your project.

In order to opt-out of the SDK magic, just add the following import anywhere in your file:

```js
import "@inlang/sdk-js/no-transforms"
```

By adding this line, the code in that file will not be transformed and you need to make sure you manually add the necessary functionality.

## Required Setup

Those files require to be set up if you want to use any functionality of the SDK

### `hooks.server.js`

```ts
import "@inlang/sdk-js/no-transforms"
import { initHandleWrapper } from "@inlang/sdk-js/adapter-sveltekit/server"

export const handle = initHandleWrapper({
	// ... see TypeScript definition or source code for all parameters
}).use(({ resolve, event }) => {
	// your code goes here

	return resolve(event)
})
```

### `/routes/+layout.server.js` (root server layout)

```ts
import "@inlang/sdk-js/no-transforms"
import { initRootLayoutServerLoadWrapper } from "@inlang/sdk-js/adapter-sveltekit/server"
import type { LayoutServerLoad } from "./$types.js"

export const load = initRootLayoutServerLoadWrapper<LayoutServerLoad>().use(() => {
	// your code goes here

	return {
		// ...
	}
})
```

### `/routes/+layout.js` (root layout)

```ts
import "@inlang/sdk-js/no-transforms"
import { initRootLayoutLoadWrapper } from "@inlang/sdk-js/adapter-sveltekit/shared"
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

### `/routes/+page.js` (root page)

```ts
import "@inlang/sdk-js/no-transforms"
import { initRootPageLoadWrapper } from "@inlang/sdk-js/adapter-sveltekit/shared"
import type { LayoutLoad } from "./$types.js"

export const load = initRootPageLoadWrapper<LayoutLoad>({
	// ... see TypeScript definition or source code for all parameters
}).use(() => {
	// your code goes here

	return {
		// ...
	}
})
```

### `/routes/+layout.svelte` (root svelte layout)

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

> The examples always show the usage of the [inlang function (`i`)](https://inlang.com/documentation/sdk/usage). You can use any other import from `@inlang/sdk-js` in the same way.

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

### `*.js`

You need to pass the `i` function to the function you want to call it from.

```ts
import "@inlang/sdk-js/no-transforms"
import type { InlangFunction } from "@inlang/sdk-js/runtime"

const getPageTitle = (i: InlangFunction, page: string) => {
	return i(`title.${page}`)
}
```

And then call it from somewhere like this:

```svelte
<script>
	import { i } from '@inlang/sdk-js'
	import { getPageTitle } from './utils.js'
</script>

<svelte:head>
	<title>{getPageTitle(i, 'home')}</title>
</svelte:head>
```

### `+layout.server.js`

The first parameter of the `use` function is the Event you usually get on a `load` function. You can access any import from the SDK through the second parameter.

```ts
import "@inlang/sdk-js/no-transforms"
import { initLayoutServerLoadWrapper } from "@inlang/sdk-js/adapter-sveltekit/server"
import type { LayoutServerLoad } from "./$types.js"

export const load = initLayoutServerLoadWrapper<LayoutServerLoad>().use(({ params }, { i }) => {
	return {
		id: params.id,
		title: i("title", { name: "inlang" }),
	}
})
```

> You need to replace `initLayoutServerLoadWrapper` with `initRootLayoutServerLoadWrapper` of it is your root server layout file.

### `+layout.js`

The first parameter of the `use` function is the Event you usually get on a `load` function. You can access any import from the SDK through the second parameter.

```ts
import "@inlang/sdk-js/no-transforms"
import { initLoadWrapper } from "@inlang/sdk-js/adapter-sveltekit/shared"
import type { LayoutLoad } from "./$types.js"

export const load = initLoadWrapper<LayoutLoad>().use(({ params }, { i }) => {
	return {
		id: params.id,
		title: i("title", { name: "inlang" }),
	}
})
```

> You need to replace `initLoadWrapper` with `initRootLayoutLoadWrapper` of it is your root layout file.

### `+page.server.js`

The first parameter of the `use` function is the Event you usually get on a `load` function. You can access any import from the SDK through the second parameter.

```ts
import "@inlang/sdk-js/no-transforms"
import { initPageServerLoadWrapper } from "@inlang/sdk-js/adapter-sveltekit/server"
import type { PageServerLoad } from "./$types.js"

export const load = initPageServerLoadWrapper<PageServerLoad>().use(({ params }, { i }) => {
	return {
		id: params.id,
		title: i("title", { name: "inlang" }),
	}
})
```

> You need to replace `initPageServerLoadWrapper` with `initRootPageServerLoadWrapper` of it is your root server page file.

Using inlang inside Actions looks similar:

```ts
import '@inlang/sdk-js/no-transforms'
import { initRequestHandlerWrapper } from '@inlang/sdk-js/adapter-sveltekit/server'
import type { PageLoad } from "./$types.js"

const delete = initActionWrapper<PageLoad>()
	.use((event, { i }) => {
		// your code goes here
		console.info(i('delete.success'))
	})

export const actions = { delete }
```

### `+page.js`

The first parameter of the `use` function is the Event you usually get on a `load` function. You can access any import from the SDK through the second parameter.

```ts
import "@inlang/sdk-js/no-transforms"
import { initLoadWrapper } from "@inlang/sdk-js/adapter-sveltekit/shared"
import type { PageLoad } from "./$types.js"

export const load = initLoadWrapper<PageLoad>().use(({ params }, { i }) => {
	return {
		id: params.id,
		title: i("title", { name: "inlang" }),
	}
})
```

> You need to replace `initLoadWrapper` with `initRootPageLoadWrapper` of it is your root page file.

### `+server.js`

The first parameter of the `use` function is the Event you usually get on a `ReqestHandler` function. You can access any import from the SDK through the second parameter.

```ts
import "@inlang/sdk-js/no-transforms"
import { initRequestHandlerWrapper } from "@inlang/sdk-js/adapter-sveltekit/server"
import type { PageLoad } from "./$types.js"

export const GET = initRequestHandlerWrapper<PageLoad>().use(({ params }, { i }) => {
	const text = i("title", { name: "inlang" })
	return new Response(text)
})

// same goes for POST, PATCH, PUT, DELETE, OPTIONS and HEAD
```
