<script lang="ts">
	import Component from "../../components/Component.svelte"
	import { getRuntimeFromContext } from "@inlang/paraglide-js-sveltekit/adapter-sveltekit/client/not-reactive"

	const { i } = getRuntimeFromContext()

	console.info("[lang]/+page.svelte", i("welcome"))
</script>

<Component />
