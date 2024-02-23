<script>
	import { ParaglideJS } from "@inlang/paraglide-js-adapter-sveltekit"
	import { i18n } from "$lib/i18n.js"

	export let data;
</script>

<p>{data.serverLang}</p>

<ParaglideJS {i18n}>
	<slot />
</ParaglideJS>