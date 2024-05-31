<!--
	@component
	Automatically detect and manage the language of your page.
	It also adds `<link rel="alternate">` tags to the head of your page
-->
<script lang="ts" generics="T extends string">
	import type { I18n } from "./adapter.js"
	import { page } from "$app/stores"
	import { browser, dev } from "$app/environment"
	import { normaliseBase } from "./utils/normaliseBase.js"
	import { parseRoute, serializeRoute } from "./utils/route.js"
	import { getHrefBetween } from "./utils/diff-urls.js"
	import { LANGUAGE_CHANGE_INVALIDATION_KEY } from "../constants.js"
	import { base as maybe_relative_base } from "$app/paths"
	import { isExternal } from "./utils/external.js"
	import { get } from "svelte/store"
	import { invalidate } from "$app/navigation"
	import { setParaglideContext } from "./internal/index.js"
	import AlternateLinks from "./AlternateLinks.svelte"

	// The base path may be relative during SSR.
	// To make sure it is absolute, we need to resolve it against the current page URL.
	const absoluteBase = normaliseBase(maybe_relative_base, new URL($page.url)) || "/"

	/**
	 * Override the language detection with a specific language tag.
	 */
	export let languageTag: T | undefined = undefined

	/**
	 * The routing instance to use.
	 * You can create one with `createI18n()` from `@inlang/paraglide-sveltekit`.
	 */
	export let i18n: I18n<T>

	/**
	 * The language tag that was autodetected from the URL.
	 */
	$: autodetectedLanguage = i18n.getLanguageFromUrl($page.url)
	$: lang = languageTag ?? autodetectedLanguage
	$: i18n.config.runtime.setLanguageTag(lang)
	$: if (browser) document.documentElement.lang = lang
	$: if (browser) document.documentElement.dir = i18n.config.textDirection[lang] ?? "ltr"

	// count the number of language changes. 
	let numberOfLanugageChanges = 0
	$: if (lang) numberOfLanugageChanges += 1

	// on all but the first language change, invalidate language-dependent data
	$: if (browser && lang && numberOfLanugageChanges > 1)
		invalidate(LANGUAGE_CHANGE_INVALIDATION_KEY)

	function translateHref(href: string, hreflang: T | undefined): string {
		try {
			const from = new URL(get(page).url)
			const original_to = new URL(href, new URL(from))

			if (isExternal(original_to, from, absoluteBase) || i18n.config.exclude(original_to.pathname))
				return href

			const targetLanguage = hreflang ?? lang
			const [canonicalPath, dataSuffix] = parseRoute(original_to.pathname, absoluteBase)
			const translatedPath = i18n.strategy.getLocalisedPath(canonicalPath, targetLanguage)

			const to = new URL(original_to);

			to.pathname =  serializeRoute(
				translatedPath,
				absoluteBase,
				dataSuffix
			)

			return getHrefBetween(from, to)
		} catch (error) {
			if(dev) console.warn(`[paraglide-sveltekit] Failed to translate the link "${href}"`)
			return href
		}
	}

	setParaglideContext({ translateHref })

	// In svelte 5 the #key block will re-render the second the key changes,
	// not after the all the updates in the Component are done.
	// We need to make sure that changing the key happens last.
	// See https://github.com/sveltejs/svelte/issues/10597
	$: langKey = lang
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

<!-- Trigger a Re-Render whenever the language changes -->
{#key langKey}
	<slot />
{/key}
