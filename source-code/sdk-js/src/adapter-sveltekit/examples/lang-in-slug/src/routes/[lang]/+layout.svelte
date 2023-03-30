<script lang="ts">
	import { getI18nContext } from "../../inlang.js"

	const { i, languages, route, loadResource, switchLanguage } = getI18nContext()

	$: console.info("[lang]/+layout.svelte", i("welcome"))
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

<slot />
