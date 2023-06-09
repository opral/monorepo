---
title: Usage
href: /documentation/sdk/usage
description: This is a list of all the functions you can export from the inlang SDK, what they provide and how to use them.
---

# {% $frontmatter.title %} SDKs

With `@inlang/sdk-js` you get many useful functions to help you implement internationalization in your application. This is a list of all the functions, what they provide and how to use them.

## `i`

Use the inlang function (`i`) to get a language dependent text. The function takes the key of the text as a parameter and returns the string according to the current language.

#### Example

```svelte
<script>
	import { i } from "@inlang/sdk-js"
</script>

<h1>{i("welcome")}</h1>
<!-- => e.g. 'Welcome to inlang!' -->
```

## `language`

The `language` variable contains the current selected language.

#### Example

```svelte
<script>
	import { language } from "@inlang/sdk-js"

	console.log(language) // => e.g 'en'
</script>
```

## `languages`

The `languages` array returns all languages that are available for this application.

#### Example

```svelte
<script>
	import { languages } from "@inlang/sdk-js"
</script>

<ul>
	{#each languages as language}
		<li>{language}</li>
	{/each}
</ul>
```

## `referenceLanguage`

The `referenceLanguage` function returns the reference language that is used to translate the texts.

#### Example

```svelte
<script>
	import { referenceLanguage } from "@inlang/sdk-js"

	console.log(referenceLanguage) // => e.g 'en'
</script>
```

## `switchLanguage`

The `switchLanguage` function allows you to change the language of the application. The function takes the language as a parameter and returns a promise that resolves when the language has been changed.

#### Example

```svelte
<script>
	import { switchLanguage } from "@inlang/sdk-js"

	async function switchLanguageToGerman() {
		console.log('switching language to german ...')
		await switchLanguage('de')
		console.log('... language switched to german')
	}
</script>

<button on:click={switchLanguageToGerman}>
	Show page in german
</button>
```

## `loadResource`

The `loadResource` function allows you to load the resource file for a specific language. The function takes the language as a parameter and returns a promise that resolves when the resource file has been loaded.

> Resources are loaded automatically, but you can already preload them to reduce the loading time when switching the language.

#### Example

```svelte
<script>
	import { loadResource, switchLanguage } from "@inlang/sdk-js"

	async function preloadGermanResource() {
		console.log('preloading german resource ...')
		await loadResource('de')
		console.log('... german resource loaded')
	}
</script>

<button on:mouseover={preloadGermanResource} on:click={() => switchLanguage('de')}>
	Show page in german
</button>
```

---

_Is something unclear or do you have questions? Reach out to us in our [Discord channel](https://discord.gg/9vUg7Rr) or open a [Discussion](https://github.com/inlang/inlang/discussions) or an [Issue](https://github.com/inlang/inlang/issues) on [Github](https://github.com/inlang/inlang)._

{% Feedback /%}
