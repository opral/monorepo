<script lang="ts">
	import { getI18nContext, inlangSymbol, setI18nContext } from "../inlang.js"
	import type { LayoutData } from "./$types.js"

	export let data: LayoutData

	setI18nContext(data[inlangSymbol])
	let { i, language } = getI18nContext()

	$: {
		setI18nContext(data[inlangSymbol])
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
