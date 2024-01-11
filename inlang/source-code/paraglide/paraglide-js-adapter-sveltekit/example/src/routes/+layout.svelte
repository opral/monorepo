<script>
	import * as runtime from "$paraglide/runtime.js";
	import { ParaglideJS } from "@inlang/paraglide-js-adapter-sveltekit"
	import { pathTranslations } from "$lib/i18n"
	export let data;
</script>

<ParaglideJS {runtime} languageTag={data.lang} paths={pathTranslations}>
	<slot />
</ParaglideJS>