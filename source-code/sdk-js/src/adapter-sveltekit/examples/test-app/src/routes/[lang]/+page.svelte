<script>
	import { i, languageTags, switchLanguage } from "@inlang/sdk-js"
	import { onMount } from "svelte"
	import { test } from "./test.js"

	onMount(() => {
		test()
	})
</script>

{#each languageTags as lang}
	<button on:click={() =>switchLanguage(lang)}>{lang}</button>
{/each}

<h1>{i("welcome")}</h1>
