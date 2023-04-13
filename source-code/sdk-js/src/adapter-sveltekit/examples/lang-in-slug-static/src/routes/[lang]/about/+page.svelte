<script lang="ts">
	import { getInlangContext } from "@inlang/sdk-js/adapter-sveltekit/client/not-reactive"

	const { i, language } = getInlangContext()

	console.info("[lang]/about/+page.svelte", i("welcome"))
</script>

<h1>About page {language}</h1>
