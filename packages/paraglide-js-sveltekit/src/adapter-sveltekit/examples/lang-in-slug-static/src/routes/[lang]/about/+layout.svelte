<script lang="ts">
	import { getRuntimeFromContext } from "@inlang/paraglide-js-sveltekit/adapter-sveltekit/client/not-reactive"

	const { i } = getRuntimeFromContext()

	console.info("[lang]/about/+layout.svelte", i("welcome"))
</script>

<slot />
