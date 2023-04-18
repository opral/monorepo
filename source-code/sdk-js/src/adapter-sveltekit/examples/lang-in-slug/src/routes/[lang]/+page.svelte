<script lang="ts">
	import Component from "../../components/Component.svelte"
	import { getRuntimeFromContext } from "@inlang/sdk-js/adapter-sveltekit/client/not-reactive"

	const { i } = getRuntimeFromContext()

	console.info("[lang]/+page.svelte", i("welcome"))
</script>

<Component />
