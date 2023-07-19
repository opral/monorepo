<script lang="ts">
	import { getRuntimeFromContext } from "@inlang/sdk-js/adapter-sveltekit/client/not-reactive"

	const { i, languageTags, route, loadResource, switchLanguage } = getRuntimeFromContext()

	$: console.info("[lang]/+layout.svelte", i("welcome"))
</script>

{#each languageTags as languageTag}
	<button
		on:mouseover={() => loadResource(languageTag)}
		on:focus={() => loadResource(languageTag)}
		on:click={() => switchLanguage(languageTag)}>{languageTag}</button
	>
{/each}

<ul>
	<li><a href={route("/")}>Home</a></li>
	<li><a href={route("/about")}>About</a></li>
</ul>

<slot />
