<script lang="ts">
	import { browser } from "$app/environment"
	import Header from "$lib/Header.svelte"
	import { getTextDirection } from "$lib/i18n.js"
	import { setLanguageTag } from "$paraglide/runtime"

	export let data

	//Set the language tag in the Paraglide runtime.
	//This determines which language the strings are translated to.
	//You should only do this in the template, to avoid concurrent requests interfering with each other.
	$: setLanguageTag(data.lang)

	$: textDirection = getTextDirection(data.lang)

	//Keep the <html> lang and dir attributes in sync with the current language
	$: if (browser) {
		document.documentElement.dir = textDirection
		document.documentElement.lang = data.lang
	}
</script>

<!-- Include alternate language links in the head -->
<Header />

<!-- Rerender the page whenever the language changes -->
{#key data.lang}
	<slot />
{/key}
