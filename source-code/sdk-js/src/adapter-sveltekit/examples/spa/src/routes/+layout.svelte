<script lang="ts">
import { getRuntimeFromData } from "@inlang/sdk-js/adapter-sveltekit/shared"
	import { getRuntimeFromContext, addRuntimeToContext } from "@inlang/sdk-js/adapter-sveltekit/client/reactive"
	import type { LayoutData } from "./$types.js"

	export let data: LayoutData

	addRuntimeToContext(getRuntimeFromData(data))

	let { i, language, languages, loadResource, switchLanguage } = getRuntimeFromContext()

	console.info("+layout.svelte", $i("welcome"))
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
