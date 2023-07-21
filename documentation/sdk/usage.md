---
title: How to use the inlang SDK
shortTitle: Usage
href: /documentation/sdk/usage
description: This is a list of all the functions you can export from the inlang SDK, what they provide and how to use them.
---

# {% $frontmatter.title %}

With `@inlang/sdk-js` you get many useful functions to help you implement internationalization in your application. This is a list of all the functions, what they provide and how to use them.

## `i`

Use the inlang function (`i`) to get a language dependent text. The function takes the key of the text as a parameter and returns the string according to the current languageTag.

#### Example

```svelte
<script>
	import { i } from "@inlang/sdk-js"
</script>

<h1>{i("welcome")}</h1>
<!-- => e.g. 'Welcome to inlang!' -->
```

## `languageTag`

The `languageTag` variable contains the current selected languageTag.

#### Example

```svelte
<script>
	import { languageTag } from "@inlang/sdk-js"

	console.log(languageTag) // => e.g 'en'
</script>
```

## `languageTags`

The `languageTags` array returns all languageTags that are available for this application.

#### Example

```svelte
<script>
	import { languageTags } from "@inlang/sdk-js"
</script>

<ul>
	{#each languageTags as languageTag}
		<li>{languageTag}</li>
	{/each}
</ul>
```

## `sourceLanguageTag`

The `sourceLanguageTag` function returns the source languageTag that is used to translate the texts.

#### Example

```svelte
<script>
	import { sourceLanguageTag } from "@inlang/sdk-js"

	console.log(sourceLanguageTag) // => e.g 'en'
</script>
```

## `changeLanguageTag`

The `changeLanguageTag` function allows you to change the languageTag of the application. The function takes the languageTag as a parameter and returns a promise that resolves when the languageTag has been changed.

#### Example

```svelte
<script>
	import { changeLanguageTag } from "@inlang/sdk-js"

	async function changeLanguageTagToGerman() {
		console.log('changing languageTag to german ...')
		await changeLanguageTag('de')
		console.log('... languageTag changes to german')
	}
</script>

<button on:click={changeLanguageTagToGerman}>
	Show page in german
</button>
```

## `loadResource`

The `loadResource` function allows you to load the resource file for a specific languageTag. The function takes the languageTag as a parameter and returns a promise that resolves when the resource file has been loaded.

> Resources are loaded automatically, but you can already preload them to reduce the loading time when changing the languageTag.

#### Example

```svelte
<script>
	import { loadResource, changeLanguageTag } from "@inlang/sdk-js"

	async function preloadGermanResource() {
		console.log('preloading german resource ...')
		await loadResource('de')
		console.log('... german resource loaded')
	}
</script>

<button on:mouseover={preloadGermanResource} on:click={() => changeLanguageTag('de')}>
	Show page in german
</button>
```

---

_Is something unclear or do you have questions? Reach out to us in our [Discord channel](https://discord.gg/9vUg7Rr) or open a [Discussion](https://github.com/inlang/inlang/discussions) or an [Issue](https://github.com/inlang/inlang/issues) on [Github](https://github.com/inlang/inlang)._
