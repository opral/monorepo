<script lang="ts">
	import Component from "../../components/Component.svelte"
	import { getI18nContext } from "../../inlang.js"

	const { i } = getI18nContext()

	console.info("[lang]/+page.svelte", i("welcome"))
</script>

<Component />
