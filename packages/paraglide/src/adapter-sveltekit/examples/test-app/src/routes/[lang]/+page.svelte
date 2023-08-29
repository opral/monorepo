<script>
	import { i, languageTags, changeLanguageTag } from "@inlang/sdk-js"
	import { onMount } from "svelte"
	import { test } from "./test.js"

	onMount(() => {
		test()
	})
</script>

{#each languageTags as lang}
	<button on:click={() => changeLanguageTag(lang)}>{lang}</button>
{/each}

<h1>{i("welcome")}</h1>
