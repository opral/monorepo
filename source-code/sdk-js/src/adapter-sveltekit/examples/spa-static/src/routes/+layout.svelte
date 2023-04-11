<script lang="ts">
	import { browser } from "$app/environment"
	import { getI18nContext, inlangSymbol, setI18nContext } from "../inlang.js"
	import type { LayoutData } from "./$types.js"

	export let data: LayoutData

	setI18nContext(data[inlangSymbol])

	let { i, language, languages, loadResource, switchLanguage } = getI18nContext()

	if (browser) {
		console.info("+layout.svelte", $i("welcome"))
	}
</script>

{#if $language}
	{#each languages as language}
		<button
			on:mouseover={() => loadResource(language)}
			on:focus={() => loadResource(language)}
			on:click={() => switchLanguage(language)}>{language}</button
		>
	{/each}

	<ul>
		<li><a href="/">Home</a></li>
		<li><a href="/about">About</a></li>
	</ul>

	<slot />

	<hr />

	{JSON.stringify(data, null, 3)}
{/if}
