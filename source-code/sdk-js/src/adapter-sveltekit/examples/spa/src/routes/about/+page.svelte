<script lang="ts">
	import { getInlangContext } from "@inlang/sdk-js/adapter-sveltekit/client/reactive"

	const { i, language } = getInlangContext()

	console.info("about/+page.svelte", $i("welcome"))
</script>

About page {$language}
