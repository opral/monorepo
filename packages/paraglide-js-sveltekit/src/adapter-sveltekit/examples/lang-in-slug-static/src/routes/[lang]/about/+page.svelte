<script lang="ts">
	import { getRuntimeFromContext } from "@inlang/paraglide-js-sveltekit/adapter-sveltekit/client/not-reactive"

	const { i, languageTag } = getRuntimeFromContext()

	console.info("[lang]/about/+page.svelte", i("welcome"))
</script>

<h1>About page {languageTag}</h1>
