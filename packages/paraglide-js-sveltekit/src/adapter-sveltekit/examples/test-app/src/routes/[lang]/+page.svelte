<script>
	import { i, languageTags, changeLanguageTag } from "@inlang/paraglide-js-sveltekit"
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
