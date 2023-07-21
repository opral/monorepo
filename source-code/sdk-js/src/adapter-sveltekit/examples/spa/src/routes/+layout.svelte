<script lang="ts">
	import { getRuntimeFromData } from "@inlang/sdk-js/adapter-sveltekit/shared"
	import {
		getRuntimeFromContext,
		addRuntimeToContext,
	} from "@inlang/sdk-js/adapter-sveltekit/client/reactive"
	import type { LayoutData } from "./$types.js"
	import { browser } from "$app/environment"

	export let data: LayoutData

	// ---- reactivity ----

	addRuntimeToContext(getRuntimeFromData(data))

	let { i, languageTag, languageTags, loadResource, changeLanguageTag } = getRuntimeFromContext()

	$: if (browser && $languageTag) {
		document.body.parentElement?.setAttribute("lang", $languageTag)

		// TODO: only if localStorageDetector
		localStorage.setItem('languageTag', $languageTag)
	}

	// ----

	$: console.info("+layout.svelte", $i("welcome"))
</script>

{#if $languageTag}
	{#each languageTags as languageTag}
		<button
			on:mouseover={() => loadResource(languageTag)}
			on:focus={() => loadResource(languageTag)}
			on:click={() => changeLanguageTag(languageTag)}>{languageTag}</button
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
