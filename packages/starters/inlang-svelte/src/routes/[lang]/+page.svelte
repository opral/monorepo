<script>
	import { i, languages, switchLanguage } from "@inlang/sdk-js"

	export let data
</script>

{#each languages as lang}
	<button on:click={() =>switchLanguage(lang)}>{lang}</button>
{/each}

<h1>{i("welcome")}</h1>
