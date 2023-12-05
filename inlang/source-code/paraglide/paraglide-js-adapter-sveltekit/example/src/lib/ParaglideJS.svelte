<script context="module" lang="ts">
	import { getLanguage, translatePath } from "$paraglide-adapter-sveltekit"
	import { languageTag, setLanguageTag, type AvailableLanguageTag, availableLanguageTags } from "$paraglide/runtime"
	import { goto as sk_goto } from "$app/navigation"
	import { page } from "$app/stores"

	type GotoPath = Parameters<typeof sk_goto>[0]
	type GotoOptions = (Parameters<typeof sk_goto>[1] & { language: string }) | undefined
	type GotoReturnType = ReturnType<typeof sk_goto>

	/**
	 * A wrapper around SvelteKit's goto function that translates the path before navigating.
	 * 
	 * Returns a Promise that resolves when SvelteKit navigates (or fails to navigate, in which case the promise rejects) to the specified url. For external URLs, use window.location = url instead of calling goto(url).
	 * @param url — Where to navigate to. Note that if you've set config.kit.paths.base and the URL is root-relative, you need to prepend the base path if you want to navigate within the app.
	 */
	function goto(url: GotoPath, options: GotoOptions): GotoReturnType {
		//Bail if the url is not a string
		if (typeof url !== "string") return sk_goto(url, options)

		//Get the language tag that should be used
		const language = options?.language ?? languageTag()

		//Translate the URL
		const translatedUrl = translatePath(url, language)

		//Navigate to the translated URL
		return sk_goto(translatedUrl, options)
	}

	export { goto }
</script>

<script lang="ts">
	$: lang = getLanguage($page.url)
	$: setLanguageTag(lang as AvailableLanguageTag)
</script>

<svelte:head>
	{#if availableLanguageTags.length >= 1}
		{#each availableLanguageTags as lang}
			<link rel="alternalte" hreflang={lang} href={translatePath($page.url.pathname, lang)} />
		{/each}
	{/if}
</svelte:head>

{#key lang}
	<slot />
{/key}
