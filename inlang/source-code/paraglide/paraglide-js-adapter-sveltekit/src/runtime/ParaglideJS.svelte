<!--
	@component
	Automatically detect and manage the language of your page.
	It also adds `<link rel="alternate">` tags to the head of your page
-->
<script lang="ts" generics="T extends string">
	import { normalize } from "./utils/path.js"

	import { serializeRoute } from "./utils/serialize-path.js"
	import { page } from "$app/stores"
	import { browser } from "$app/environment"
	import { setContext } from "svelte"
	import { PARAGLIDE_CONTEXT_KEY } from "./constants.js"
	import { base as maybe_relative_base } from "$app/paths"
	import { isExternal } from "./utils/external.js"
	import { getTranslatedPath } from "./path-translations/getTranslatedPath.js"
	import { translatePath } from "./path-translations/translatePath.js"
	import type { I18n } from "./adapter.js"

	// The base path may be relative during SSR.
	// To make sure it is absolute, we need to resolve it against the current page URL.
	const absoluteBase = normalize(new URL(maybe_relative_base, new URL($page.url)).pathname)

	/**
	 * Override the language detection with a specific language tag.
	 */
	export let languageTag: T | undefined = undefined

	/**
	 * The routing instance to use.
	 * You can create one with `createI18n()` from `@inlang/paraglide-js-adapter-sveltekit`.
	 */
	export let routing: I18n<T>

	/**
	 * If true, no alternate links will be added to the head.
	 */
	export let noAlternateLinks = false

	/**
	 * The language tag that was autodetected from the URL.
	 */
	$: autodetectedLanguage = routing.getLanguageFromUrl($page.url)

	$: lang = languageTag ?? autodetectedLanguage
	$: routing.config.runtime.setLanguageTag(lang)
	$: if (browser) document.documentElement.lang = lang

	function translateHref(href: string, hreflang: string | undefined): string {
		const from = new URL($page.url)
		const original_to = new URL(href, new URL(from))

		if (isExternal(original_to, from, absoluteBase)) {
			return href
		}

		if (routing.config.exclude(original_to.pathname)) {
			return href
		}

		const language = hreflang ?? lang
		const canonicalPath = normalize(original_to.pathname.slice(absoluteBase.length))
		const translatedPath = getTranslatedPath(canonicalPath, language, routing.config.translations)

		return serializeRoute({
			base: absoluteBase,
			lang: language,
			path: translatedPath,
			dataSuffix: undefined,
			includeLanguage: true,
			defaultLanguageTag: routing.config.defaultLanguageTag,
			prefixDefaultLanguage: routing.config.prefixDefaultLanguage,
		})
	}

	setContext(PARAGLIDE_CONTEXT_KEY, { translateHref })
</script>

<svelte:head>
	{#if !noAlternateLinks && !routing.config.exclude($page.url.pathname)}
		<!-- If there is more than one language, add alternate links -->
		{#if routing.config.runtime.availableLanguageTags.length >= 1}
			{#each routing.config.runtime.availableLanguageTags as lang}
				<link
					rel="alternate"
					hreflang={lang}
					href={translatePath($page.url.pathname, lang, routing.config.translations, {
						base: absoluteBase,
						availableLanguageTags: routing.config.runtime.availableLanguageTags,
						defaultLanguageTag: routing.config.defaultLanguageTag,
						prefixDefaultLanguage: routing.config.prefixDefaultLanguage,
					})}
				/>
			{/each}
		{/if}
	{/if}
</svelte:head>

<!-- Trigger a Re-Render whenever the language changes -->
{#key lang}
	<slot />
{/key}
