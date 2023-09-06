<script lang="ts">
	import { getRuntimeFromContext } from "@inlang/sdk-js/adapter-sveltekit/client/not-reactive"

	const { i } = getRuntimeFromContext()

	console.info("[lang]/about/+layout.svelte", i("welcome"))
</script>

<slot />
