<script lang="ts">
	import { getRuntimeFromContext } from "@inlang/sdk-js/adapter-sveltekit/client/reactive"

	const { i } = getRuntimeFromContext()

	console.info("about/+layout.svelte", $i("welcome"))
</script>

<slot />
