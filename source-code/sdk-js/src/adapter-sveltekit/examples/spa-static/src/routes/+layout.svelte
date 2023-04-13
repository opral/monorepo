<script lang="ts">
	import { browser } from "$app/environment"
	import { getInlangPayload } from "@inlang/sdk-js/adapter-sveltekit/shared"
	import { getInlangContext, setInlangContext } from "@inlang/sdk-js/adapter-sveltekit/client/reactive"
	import type { LayoutData } from "./$types.js"

	export let data: LayoutData

	setInlangContext(getInlangPayload(data))

	let { i, language, languages, loadResource, switchLanguage } = getInlangContext()

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
