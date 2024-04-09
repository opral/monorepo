<!--
	@component
	Automatically detect and manage the language of your page.
	It also adds `<link rel="alternate">` tags to the head of your page
-->
<script lang="ts" generics="T extends string">
	import { normaliseBase } from "./utils/normaliseBase.js"
	import { getPathInfo } from "./utils/get-path-info.js"
	import { getHrefBetween } from "./utils/diff-urls.js"
	import { serializeRoute } from "./utils/serialize-path.js"
	import { page } from "$app/stores"
	import { browser } from "$app/environment"
	import { setContext } from "svelte"
	import { LANGUAGE_CHANGE_INVALIDATION_KEY, PARAGLIDE_CONTEXT_KEY } from "../constants.js"
	import { base as maybe_relative_base } from "$app/paths"
	import { isExternal } from "./utils/external.js"
	import { getTranslatedPath } from "./path-translations/getTranslatedPath.js"
	import { translatePath } from "./path-translations/translatePath.js"
	import type { I18n } from "./adapter.js"
	import { get } from "svelte/store"
	import { invalidate } from "$app/navigation"

	// The base path may be relative during SSR.
	// To make sure it is absolute, we need to resolve it against the current page URL.
	const absoluteBase = normaliseBase(maybe_relative_base, new URL($page.url)) || "/"

	/**
	 * Override the language detection with a specific language tag.
	 */
	export let languageTag: T | undefined = undefined

	/**
	 * The routing instance to use.
	 * You can create one with `createI18n()` from `@inlang/paraglide-js-adapter-sveltekit`.
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

	let numberOfLanugageChanges = 0
	$: if (lang) numberOfLanugageChanges += 1
	$: if (browser && lang && numberOfLanugageChanges > 1)
		invalidate(LANGUAGE_CHANGE_INVALIDATION_KEY)

	function translateHref(href: string, hreflang: string | undefined): string {
		const from = new URL(get(page).url)
		const original_to = new URL(href, new URL(from))

		if (isExternal(original_to, from, absoluteBase)) {
			return href
		}

		if (i18n.config.exclude(original_to.pathname)) {
			return href
		}

		const language = hreflang ?? lang

		const { path: canonicalPath, trailingSlash } = getPathInfo(original_to.pathname, {
			base: absoluteBase,
			availableLanguageTags: i18n.config.runtime.availableLanguageTags,
			defaultLanguageTag: i18n.config.defaultLanguageTag,
		})

		const translatedPath = getTranslatedPath(canonicalPath, language, i18n.config.translations, i18n.config.matchers)

		const newPathname = serializeRoute({
			base: absoluteBase,
			lang: language,
			path: translatedPath,
			dataSuffix: undefined,
			includeLanguage: true,
			trailingSlash,
			defaultLanguageTag: i18n.config.defaultLanguageTag,
			prefixDefaultLanguage: i18n.config.prefixDefaultLanguage,
		})

		const to = new URL(original_to)
		to.pathname = newPathname

		return getHrefBetween(from, to)
	}

	setContext(PARAGLIDE_CONTEXT_KEY, { translateHref })

	// In svelte 5 the #key block will re-render the second the key changes,
	// not after the all the updates in the Component are done.
	// We need to make sure that changing the key happens last.
	// See https://github.com/sveltejs/svelte/issues/10597
	$: langKey = lang
</script>

<svelte:head>
	{#if i18n.config.seo.noAlternateLinks !== true && !i18n.config.exclude($page.url.pathname)}
		<!-- If there is more than one language, add alternate links -->
		{#if i18n.config.runtime.availableLanguageTags.length >= 1}
			{#each i18n.config.runtime.availableLanguageTags as lang}
				{@const path = translatePath($page.url.pathname, lang, i18n.config.translations, 
				i18n.config.matchers,
				{
					base: absoluteBase,
					availableLanguageTags: i18n.config.runtime.availableLanguageTags,
					defaultLanguageTag: i18n.config.defaultLanguageTag,
					prefixDefaultLanguage: i18n.config.prefixDefaultLanguage,
				})}

				{@const href =
					$page.url.host === "sveltekit-prerender" ? path : new URL(path, new URL($page.url)).href}

				<!-- Should be a fully qualified href, including protocol -->
				<link rel="alternate" hreflang={lang} {href} />
			{/each}
		{/if}
	{/if}
</svelte:head>

<!-- Trigger a Re-Render whenever the language changes -->
{#key langKey}
	<slot />
{/key}
