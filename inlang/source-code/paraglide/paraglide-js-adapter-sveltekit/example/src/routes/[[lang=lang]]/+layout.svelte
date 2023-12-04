<script lang="ts">
	import { page } from "$app/stores"
	import { getLanguage } from "$paraglide-adapter-sveltekit"
	import { setLanguageTag, type AvailableLanguageTag } from "$paraglide/runtime"

	//Determine the current language from the URL. Fall back to the source language if none is specified.
	$: lang = getLanguage($page.url);
	
	//Set the language tag in the Paraglide runtime.
	//This determines which language the strings are translated to.
	//You should only do this in the template, to avoid concurrent requests interfering with each other.
	$: setLanguageTag(lang as AvailableLanguageTag)
</script>


{#key lang}
	<slot />
{/key}
