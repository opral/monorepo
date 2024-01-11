<script lang="ts">
	import { ParaglideJS } from "@inlang/paraglide-js-adapter-sveltekit"
	import * as runtime from "$paraglide/runtime.js";
</script>

<ParaglideJS {runtime}>
	<slot />
</ParaglideJS>