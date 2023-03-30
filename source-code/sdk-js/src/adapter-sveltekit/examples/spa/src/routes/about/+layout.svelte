<script lang="ts">
	import { getI18nContext } from "../../inlang.js"

	const { i } = getI18nContext()

	console.info("about/+layout.svelte", i("welcome"))
</script>

<slot />
