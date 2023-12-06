<script>
	import translatePath from "$paraglide-adapter-sveltekit:translate-path"
	import getLanguage from "$paraglide-adapter-sveltekit:get-language"
	import {
		setLanguageTag,
		availableLanguageTags,
		sourceLanguageTag,
		onSetLanguageTag,
	} from "$paraglide-adapter-sveltekit:runtime"
	import { page } from "$app/stores"
	import { beforeNavigate, goto } from "$app/navigation"
	import { browser } from "$app/environment"

	/** @type { string | undefined } */
	export let languageTag = undefined

	$: lang = languageTag ?? getLanguage($page.url) ?? sourceLanguageTag
	$: setLanguageTag(lang)

	/**
	 * Normalize a path, so that it never ends with a slash.
	 * This makes comparing paths easier.
	 *
	 * @param {string} path
	 * @returns {string}
	 */
	function normalizePath(path) {
		if (path.endsWith("/")) {
			return path.slice(0, -1)
		}
		return path
	}

	// This is a dirty dirty hack to differentiate between regular goto's
	// and goto's that are triggered by the language changing
	let isLanguageChange = false

	onSetLanguageTag((lang) => {
		//Don't do anything if we're server-side rendering
		if (browser) {
			//check if the path would be different in the new language & navigate if so
			const newPath = translatePath($page.url.pathname, lang)
			if (normalizePath(newPath) !== normalizePath($page.url.pathname)) {
				//Disable the beforeNavigate handler, so that it won't re-translate the path
				isLanguageChange = true
				goto(newPath)
			}

			//Update the html lang attribute
			document.documentElement.lang = lang
		}
	})

	beforeNavigate((event) => {
		//If `goto` to internal route
		if (event.type === "goto") {
			//If the user is navigating to a different language, we don't want to rewrite the path
			const skipHandling = isLanguageChange === true
			isLanguageChange = false
			if (skipHandling) return

			if (event.to && event.to.route.id) {
				if (event.to.url.searchParams.get("no-translate") === "true") {
					return
				}
				const existingLanguage = getLanguage(event.to.url)

				if (existingLanguage) {
					//If the language is already in the path, we don't need to do anything
					return
				}

				/*
				If there isn't an existing language, check if translating the path would change it
				only navigate if it would

				This avoids an infinite loop of navigation where this beforeNavigate gets triggered again & again
				*/

				const translatedPath = translatePath(event.to.url.pathname, lang)
				if (normalizePath(translatedPath) === normalizePath(event.to.url.pathname)) {
					return
				}

				event.cancel()
				goto(translatedPath)
			}
		}
	})
</script>

<svelte:head>
	<!-- If there is more than one language, add alternate links -->
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
