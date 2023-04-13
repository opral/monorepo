<script lang="ts">
	import Component from "../../components/Component.svelte"
	import { getInlangContext } from "@inlang/sdk-js/adapter-sveltekit/client"

	const { i } = getInlangContext()

	console.info("[lang]/+page.svelte", i("welcome"))
</script>

<Component />
