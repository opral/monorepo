<script>
	import { i, languages, switchLanguage } from "@inlang/sdk-js"
	import { onMount } from "svelte"
	import { test } from "./test.js"

	onMount(() => {
		test()
	})
</script>

{#each languages as lang}
	<button on:click={() => switchLanguage(lang)}>{lang}</button>
{/each}

<h1>{i("welcome")}</h1>
