<script lang="ts">
	import { getInlangContext } from "@inlang/sdk-js/adapter-sveltekit/client"

	const { i } = getInlangContext()

	console.info("about/+layout.svelte", $i("welcome"))
</script>

<slot />
