<script lang="ts">
	import { getInlangContext } from "@inlang/sdk-js/adapter-sveltekit/client/not-reactive"

	const { i } = getInlangContext()

	console.info("[lang]/about/+layout.svelte", i("welcome"))
</script>

<slot />
