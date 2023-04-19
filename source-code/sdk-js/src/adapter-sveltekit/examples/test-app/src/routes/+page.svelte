<script>
	import { i, languages, switchLanguage } from "@inlang/sdk-js"
	import { onMount } from "svelte"

	let name = "SvelteKit"

	onMount(() => {
		setTimeout(async () => {
			name = "Ivan" // TODO: variables don't work because the plugin-json does not support them
		}, 1000)
	})
</script>

{#each languages as lang}
	<button on:click={() =>switchLanguage(lang)}>{lang}</button>
{/each}

<h1>{i("welcome", { name })}</h1>
