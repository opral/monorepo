<script>
	import { i } from "@inlang/sdk-js"
	import { onMount } from "svelte"

	let name = "SvelteKit"

	onMount(() => {
		setTimeout(async () => {
			name = "Ivan"
		}, 1000)
	})
</script>

<h1>{i("welcome", { name })}</h1>
