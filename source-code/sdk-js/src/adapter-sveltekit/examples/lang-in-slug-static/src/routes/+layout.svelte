<script lang="ts">
	import { getInlangContext, setInlangContext } from "@inlang/sdk-js/adapter-sveltekit/client/not-reactive"
	import { getInlangPayload } from "@inlang/sdk-js/adapter-sveltekit/shared"
	import type { LayoutData } from "./$types.js"

	export let data: LayoutData

	setInlangContext(getInlangPayload(data))
	let { i, language } = getInlangContext()

	$: {
		setInlangContext(getInlangPayload(data))
		;({ i, language } = getInlangContext())
	}

	$: console.info("+layout.svelte", i("welcome"))
	$: console.log(language)
</script>

{#if language}
	{#key language}
		<slot />

		<hr />

		{JSON.stringify(data, null, 3)}
	{/key}
{/if}
