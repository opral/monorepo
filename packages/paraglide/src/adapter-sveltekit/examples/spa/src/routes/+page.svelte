<script lang="ts">
	import Component from "../components/Component.svelte"
	import { getRuntimeFromContext } from "@inlang/sdk-js/adapter-sveltekit/client/reactive"

	const { i } = getRuntimeFromContext()

	console.info("+page.svelte", $i("welcome"))
</script>

<Component />
