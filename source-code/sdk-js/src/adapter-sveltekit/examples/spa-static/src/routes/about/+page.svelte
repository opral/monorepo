<script lang="ts">
	import { getInlangContext } from "@inlang/sdk-js/adapter-sveltekit/client"

	const { i, language } = getInlangContext()

	console.info("about/+page.svelte", $i("welcome"))
</script>

About page {$language}
