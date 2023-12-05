<script>
	import translatePath from "$paraglide-adapter-sveltekit:translate-path"
	import getLanguage from "$paraglide-adapter-sveltekit:get-language"
	import { setLanguageTag, availableLanguageTags, sourceLanguageTag, onSetLanguageTag } from "$paraglide-adapter-sveltekit:runtime"
	import { page } from "$app/stores"
	import { goto } from "$app/navigation"
	import { browser } from "$app/environment"

	/** @type { string | undefined } */
	export let languageTag = undefined

	$: lang = languageTag ?? getLanguage($page.url) ?? sourceLanguageTag;
	$: setLanguageTag(lang)


	/**
	 * Normalize a path, so that it never ends with a slash.
	 * This makes comparing paths easier.
	 * 
	 * @param {string} path
	 * @returns {string}
	 */
	function normalizePath(path) {
		if(path.endsWith("/")) {
			return path.slice(0, -1)
		}
		return path
	}

	onSetLanguageTag((lang) => {
		//Don't do anything if we're server-side rendering
		if(browser) {

			//check if the path would be different in the new language & navigate if so
			const newPath = translatePath($page.url.pathname, lang);
			if(normalizePath(newPath) !== normalizePath($page.url.pathname)) {
				console.log($page.url.pathname, newPath)
				goto(newPath)
			}
		}
	})
</script>

<svelte:head>
	{#if availableLanguageTags.length >= 1}
		{#each availableLanguageTags as lang}
			<link rel="alternate" hreflang={lang} href={translatePath($page.url.pathname, lang)} />
		{/each}
	{/if}
</svelte:head>

<!-- Trigger a Re-Render whenever the language changes -->
{#key lang}
	<slot />
{/key}
