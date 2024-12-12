<!--
	@component
	Automatically detect and manage the language of your page.
	It also adds `<link rel="alternate">` tags to the head of your page.
	
	The component handles:
	- Language detection and switching
	- URL localization
	- SEO meta tags
	- Document language attributes
-->
<script lang="ts" generics="T extends string">
	import type { I18n } from "./adapter.server.js"
	import { page } from "$app/stores"
	import { browser, dev } from "$app/environment"
	import { normaliseBase } from "./utils/normaliseBase.js"
	import { parseRoute, serializeRoute } from "./utils/route.js"
	import { getHrefBetween } from "./utils/diff-urls.js"
	import { LANGUAGE_CHANGE_INVALIDATION_KEY } from "../constants.js"
	import { base as maybe_relative_base } from "$app/paths"
	import { isExternal } from "./utils/external.js"
	import { invalidate } from "$app/navigation"
	import { setParaglideContext } from "./internal/index.js"
	import AlternateLinks from "./AlternateLinks.svelte"
	import { createLangCookie } from "./utils/cookie.js"

	/**
	 * Component props interface using Svelte 5's $props
	 * @property {T | undefined} languageTag - Override the language detection with a specific language tag
	 * @property {I18n<T>} i18n - The routing instance created with `createI18n()` from `@inlang/paraglide-sveltekit`
	 */
	const { languageTag, i18n } = $props<{
		languageTag: T | undefined;
		i18n: I18n<T>;
	}>()

	// The base path may be relative during SSR.
	// To make sure it is absolute, we need to resolve it against the current page URL.
	const absoluteBase = $derived(normaliseBase(maybe_relative_base, new URL($page.url)) || "/")

	// Track the number of language changes to handle invalidation
	let numberOfLanguageChanges = $state(0)
	
	// Derive the current language from props or URL
	const currentUrl = $derived(new URL($page.url))
	const lang = $derived(languageTag ?? i18n.getLanguageFromUrl(currentUrl))
	
	// This key is used to force re-renders of slot content when language changes
	const langKey = $derived(lang)

	// Track if we've initialized the language
	let isInitialized = $state(false)

	/**
	 * Effect to handle language changes and browser-specific operations
	 * Only runs after initial mount and when language actually changes
	 */
	$effect(() => {
		if (!browser || !lang) return

		if (!isInitialized) {
			isInitialized = true
			i18n.config.runtime.setLanguageTag(lang)
			document.documentElement.lang = lang
			document.documentElement.dir = i18n.config.textDirection[lang] ?? "ltr"
			document.cookie = createLangCookie(lang, absoluteBase)
			return
		}

		// Handle subsequent language changes
		i18n.config.runtime.setLanguageTag(lang)
		document.documentElement.lang = lang
		document.documentElement.dir = i18n.config.textDirection[lang] ?? "ltr"
		
		numberOfLanguageChanges++
		
		// Invalidate language-dependent data after first change or in dev mode
		if (numberOfLanguageChanges > 1 || dev) {
			invalidate(LANGUAGE_CHANGE_INVALIDATION_KEY)
		}
		
		document.cookie = createLangCookie(lang, absoluteBase)
	})

	/**
	 * Translates a URL to the target language
	 * @param {string} href - The URL to translate
	 * @param {T | undefined} hreflang - The target language tag
	 * @returns {string} The translated URL
	 */
	function translateHref(href: string, hreflang: T | undefined): string {
		try {
			const localisedCurrentUrl = new URL($page.url)
			const [localisedCurrentPath, suffix] = parseRoute(localisedCurrentUrl.pathname, absoluteBase)
			const canonicalCurrentPath = i18n.strategy.getCanonicalPath(localisedCurrentPath, lang)

			const canonicalCurrentUrl = new URL(localisedCurrentUrl)
			canonicalCurrentUrl.pathname = serializeRoute(canonicalCurrentPath, absoluteBase, suffix)

			const original_to = new URL(href, new URL(canonicalCurrentUrl))

			if (
				isExternal(original_to, localisedCurrentUrl, absoluteBase) ||
				i18n.config.exclude(original_to.pathname)
			)
				return href

			const targetLanguage = hreflang ?? lang
			const [canonicalPath, dataSuffix] = parseRoute(original_to.pathname, absoluteBase)
			const translatedPath = i18n.strategy.getLocalisedPath(canonicalPath, targetLanguage)

			const to = new URL(original_to)
			to.pathname = serializeRoute(translatedPath, absoluteBase, dataSuffix)

			return getHrefBetween(localisedCurrentUrl, to)
		} catch (error) {
			if (dev) console.warn(`[paraglide-sveltekit] Failed to translate the link "${href}"`)
			return href
		}
	}

	// Set up the context for child components
	setParaglideContext({ translateHref })
</script>

<svelte:head>
	{#if i18n.config.seo.noAlternateLinks !== true && !i18n.config.exclude($page.url.pathname)}
		<AlternateLinks
			availableLanguageTags={i18n.config.runtime.availableLanguageTags}
			strategy={i18n.strategy}
			currentLang={lang}
		/>
	{/if}
</svelte:head>

<!-- Re-render slot content whenever the language changes -->
{#key langKey}
	<slot />
{/key}
