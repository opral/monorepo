<script lang="ts">
	import { getRuntimeFromContext } from "@inlang/sdk-js/adapter-sveltekit/client/not-reactive"

	const { i, language } = getRuntimeFromContext()

	console.info("[lang]/about/+page.svelte", i("welcome"))
</script>

<h1>About page {language}</h1>
