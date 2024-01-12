<script>
	import { ParaglideJS } from "@inlang/paraglide-js-adapter-sveltekit"
	import { i18n } from "$lib/i18n.js"
	export let data;
</script>

<ParaglideJS {i18n} languageTag={data.lang}>
	<slot />
</ParaglideJS>