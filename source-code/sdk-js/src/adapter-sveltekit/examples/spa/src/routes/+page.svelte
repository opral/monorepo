<script lang="ts">
	import Component from "../components/Component.svelte"
	import { getInlangContext } from "@inlang/sdk-js/adapter-sveltekit/client/reactive"

	const { i } = getInlangContext()

	console.info("+page.svelte", $i("welcome"))
</script>

<Component />
