<script lang="ts">
	import { getI18nContext } from "../../../inlang.js"

	const { i, language } = getI18nContext()

	console.info("[lang]/about/+page.svelte", i("welcome"))
</script>

<h1>About page {language}</h1>
