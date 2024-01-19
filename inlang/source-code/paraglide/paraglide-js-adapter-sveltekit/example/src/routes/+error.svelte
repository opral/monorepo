<script>
	import { base } from "$app/paths"
	import { page } from "$app/stores"
	import { routing } from "$lib/i18n"
    import * as m from "$paraglide/messages.js"
    import { ParaglideJS } from "@inlang/paraglide-js-adapter-sveltekit"
</script>

<ParaglideJS {routing} languageTag="en">
    <h1>{$page.error?.message}</h1>
    <a href="{base}/">{m.home()}</a>
</ParaglideJS>