<script lang="ts">
	import { getRuntimeFromContext } from "@inlang/sdk-js/adapter-sveltekit/client/not-reactive"

	const { i, languages, route, loadResource, switchLanguage } = getRuntimeFromContext()

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
