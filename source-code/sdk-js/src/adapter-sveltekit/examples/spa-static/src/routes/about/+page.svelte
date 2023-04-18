<script lang="ts">
	import { getRuntimeFromContext } from "@inlang/sdk-js/adapter-sveltekit/client/reactive"

	const { i, language } = getRuntimeFromContext()

	console.info("about/+page.svelte", $i("welcome"))
</script>

About page {$language}
