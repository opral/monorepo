<script>
	import * as runtime from "$paraglide/runtime.js";
	import { ParaglideJS } from "@inlang/paraglide-js-adapter-sveltekit"
	export let data;
</script>

<ParaglideJS {runtime} languageTag={data.lang}>
	<slot />
</ParaglideJS>