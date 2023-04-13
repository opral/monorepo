<script lang="ts">
	import { getI18nContext } from "../../inlang.js"

	const { i, language } = getI18nContext()

	console.info("about/+page.svelte", $i("welcome"))
</script>

About page {$language}
