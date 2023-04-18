<script lang="ts">
	import { getRuntimeFromContext, addRuntimeToContext } from "@inlang/sdk-js/adapter-sveltekit/client/not-reactive"
	import { getRuntimeFromData } from "@inlang/sdk-js/adapter-sveltekit/shared"
	import type { LayoutData } from "./$types.js"

	export let data: LayoutData

	// ---- no reactivity ----

	addRuntimeToContext(getRuntimeFromData(data))
	let { i, language } = getRuntimeFromContext()

	$: {
		addRuntimeToContext(getRuntimeFromData(data))
		;({ i, language } = getRuntimeFromContext())
	}

	// ----

	$: console.info("+layout.svelte", i("welcome"))
</script>

{#if language}
	{#key language}
		<slot />

		<hr />

		{JSON.stringify(data, null, 3)}
	{/key}
{/if}
