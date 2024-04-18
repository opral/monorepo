<script>
	import "$lib/ui/styles.css"
	import { ParaglideJS } from "@inlang/paraglide-sveltekit"
	import { i18n } from "$lib/i18n.js"
	import Header from "$lib/ui/Header.svelte"
</script>

<ParaglideJS {i18n}>
	<Header />

	<main>
		<slot />
	</main>
</ParaglideJS>

<style>
	main {
		max-width: 800px;
		margin: 0 auto;
		padding: 1em;
	}
</style>