<script lang="ts">
	import { getInlangPayload } from "@inlang/sdk-js/adapter-sveltekit/shared"
	import { getInlangContext, setInlangContext } from "@inlang/sdk-js/adapter-sveltekit/client/not-reactive"
	import type { LayoutData } from "./$types.js"

	export let data: LayoutData

	setInlangContext(getInlangPayload(data))
	let { i, language } = getInlangContext()

	$: {
		setInlangContext(getInlangPayload(data))
		;({ i, language } = getInlangContext())
	}

	$: console.info("+layout.svelte", i("welcome"))
</script>

{#key language}
	<slot />

	<hr />

	{JSON.stringify(data, null, 3)}
{/key}
