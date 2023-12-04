<script>
	import { page } from "$app/stores"
	import { getLanguage } from "$paraglide-adapter-sveltekit"
	import { setLanguageTag } from "$paraglide/runtime.js"

    // @prettier-ignore
	$: lang = (/** @type {import("$paraglide/runtime.js").AvailableLanguageTag} */ (
		getLanguage($page.url)
	))

	$: setLanguageTag(lang)
</script>

{#key lang}
	<slot />
{/key}
