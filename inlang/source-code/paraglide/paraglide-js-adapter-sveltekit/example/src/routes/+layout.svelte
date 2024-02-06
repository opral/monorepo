<script>
	import { ParaglideJS } from "@inlang/paraglide-js-adapter-sveltekit"
	import { i18n } from "$lib/i18n.js"
</script>

<ParaglideJS {i18n}>
	<slot />
</ParaglideJS>