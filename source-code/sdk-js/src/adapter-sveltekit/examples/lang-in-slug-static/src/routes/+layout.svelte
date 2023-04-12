<script lang="ts">
	import { getI18nContext, setI18nContext } from "../inlang.js"
	import { getInlangPayload } from "@inlang/sdk-js/adapter-sveltekit/shared"
	import type { LayoutData } from "./$types.js"

	export let data: LayoutData

	setI18nContext(getInlangPayload(data))
	let { i, language } = getI18nContext()

	$: {
		setI18nContext(getInlangPayload(data))
		;({ i, language } = getI18nContext())
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
