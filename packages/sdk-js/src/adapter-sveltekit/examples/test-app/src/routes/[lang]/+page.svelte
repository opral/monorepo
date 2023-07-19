<script>
	import { i, languageTags, switchLanguage } from "@inlang/sdk-js"

	export let data
</script>

{#each languageTags as lang}
	<button on:click={() =>switchLanguage(lang)}>{lang}</button>
{/each}

<h1>{i("welcome")}</h1>
