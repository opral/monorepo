<script>
	import { i, languages, changeLanguageTag } from "@inlang/sdk-js"

	export let data
</script>

{#each languages as lang}
	<button on:click={() =>changeLanguageTag(lang)}>{lang}</button>
{/each}

<h1>{i("welcome")}</h1>
