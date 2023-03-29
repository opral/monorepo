<script lang="ts">
	import { getI18nContext, inlangSymbol, setI18nContext } from "../../inlang.js"
	import type { LayoutData } from "./$types.js"

	export let data: LayoutData

	setI18nContext(data[inlangSymbol])
	let { i, language, languages, route, loadResource, switchLanguage } = getI18nContext()

	$: {
		setI18nContext(data[inlangSymbol])
		;({ i, language, route, loadResource, switchLanguage } = getI18nContext())
	}

	$: console.info("+layout.svelte", i("welcome"))
</script>

{#each languages as language}
	<button
		on:mouseover={() => loadResource(language)}
		on:focus={() => loadResource(language)}
		on:click={() => switchLanguage(language)}>{language}</button
	>
{/each}

<ul>
	<li><a href={route("/")}>Home</a></li>
	<li><a href={route("/about")}>About</a></li>
</ul>

{#key language}
	<slot />
{/key}
