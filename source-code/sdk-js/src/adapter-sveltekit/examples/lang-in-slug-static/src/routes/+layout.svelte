<script lang="ts">
	import { getRuntimeFromContext, setRuntimeToContext } from "@inlang/sdk-js/adapter-sveltekit/client/not-reactive"
	import { getRuntimeFromData } from "@inlang/sdk-js/adapter-sveltekit/shared"
	import type { LayoutData } from "./$types.js"

	export let data: LayoutData

	setRuntimeToContext(getRuntimeFromData(data))
	let { i, language } = getRuntimeFromContext()

	$: {
		setRuntimeToContext(getRuntimeFromData(data))
		;({ i, language } = getRuntimeFromContext())
	}

	$: console.info("+layout.svelte", i("welcome"))
</script>

{#if language}
	{#key language}
		<slot />

		<hr />

		{JSON.stringify(data, null, 3)}
	{/key}
{/if}
