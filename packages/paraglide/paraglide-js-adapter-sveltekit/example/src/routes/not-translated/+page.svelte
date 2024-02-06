<script>
	import { ParaglideJS } from "@inlang/paraglide-js-adapter-sveltekit"
	import { base } from "$app/paths"
	import * as m from "$paraglide/messages.js"
	import { i18n } from "$lib/i18n"
</script>
<h1>Not Translated</h1>

<ParaglideJS {i18n} languageTag="en">
	<a href="{base}/">{m.home()}</a>
</ParaglideJS>