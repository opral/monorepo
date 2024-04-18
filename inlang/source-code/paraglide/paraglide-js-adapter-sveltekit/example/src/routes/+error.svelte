<script>
	import { page } from "$app/stores"
	import { i18n } from "$lib/i18n"
    import { ParaglideJS } from "@inlang/paraglide-sveltekit"
</script>

<ParaglideJS {i18n} languageTag="en">
    <h1>{$page.error?.message}</h1>
</ParaglideJS>