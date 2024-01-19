<script>
	import { ParaglideJS } from "@inlang/paraglide-js-adapter-sveltekit"
	import { routing } from "$lib/i18n.js"
</script>

<ParaglideJS {routing}>
	<slot />
</ParaglideJS>