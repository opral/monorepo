<script>
	import { ParaglideJS } from "@inlang/paraglide-js-adapter-sveltekit"
	import { base } from "$app/paths"
	import * as m from "$paraglide/messages.js"
	import { routing } from "$lib/i18n"
</script>
<h1>Not Translated</h1>

<ParaglideJS {routing} languageTag="en">
	<a href="{base}/">{m.home()}</a>
</ParaglideJS>