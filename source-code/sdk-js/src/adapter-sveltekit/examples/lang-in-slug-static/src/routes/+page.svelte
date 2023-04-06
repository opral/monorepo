<script lang="ts">
	import { onMount } from "svelte"
	import { goto } from "$app/navigation"

	onMount(() => {
		const language = Math.random() > 0.5 ? "en" : "de"
		goto(`/${language}`)
	})
</script>
