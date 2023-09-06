<script lang="ts">
	import { getRuntimeFromContext } from "@inlang/paraglide-js-sveltekit/adapter-sveltekit/client/reactive"

	const { i } = getRuntimeFromContext()

	console.info("about/+layout.svelte", $i("welcome"))
</script>

<slot />
