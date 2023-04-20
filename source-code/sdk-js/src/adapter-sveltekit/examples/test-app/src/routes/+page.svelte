<script>
	import { i, languages, switchLanguage } from "@inlang/sdk-js"
</script>

{#each languages as lang}
	<button on:click={() =>switchLanguage(lang)}>{lang}</button>
{/each}

<h1>{i("welcome")}</h1>
