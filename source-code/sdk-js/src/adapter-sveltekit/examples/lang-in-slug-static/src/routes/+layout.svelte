<script lang="ts">
	import { getRuntimeFromContext, addRuntimeToContext } from "@inlang/sdk-js/adapter-sveltekit/client/not-reactive"
	import { getRuntimeFromData } from "@inlang/sdk-js/adapter-sveltekit/shared"
	import type { LayoutData } from "./$types.js"
	import { browser } from '$app/environment'

	export let data: LayoutData

	// ---- no reactivity ----

	addRuntimeToContext(getRuntimeFromData(data))
	let { i, languageTag } = getRuntimeFromContext()

	$: if (browser) {
		addRuntimeToContext(getRuntimeFromData(data))
		;({ i, languageTag } = getRuntimeFromContext())
	}

	// ----

	$: console.info("+layout.svelte", i("welcome"))
</script>

{#if languageTag}
	{#key languageTag}
		<slot />

		<hr />

		{JSON.stringify(data, null, 3)}
	{/key}
{/if}
