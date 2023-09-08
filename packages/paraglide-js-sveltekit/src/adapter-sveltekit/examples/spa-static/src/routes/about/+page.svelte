<script lang="ts">
	import { getRuntimeFromContext } from "@inlang/paraglide-js-sveltekit/adapter-sveltekit/client/reactive"

	const { i, languageTag } = getRuntimeFromContext()

	console.info("about/+page.svelte", $i("welcome"))
</script>

About page {$languageTag}
