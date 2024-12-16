<!--
	@component
	Automatically detect and manage the language of your page.
	It also adds `<link rel="alternate">` tags to the head of your page
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
	import { get } from "svelte/store"
	import { invalidate } from "$app/navigation"
	import { setParaglideContext } from "./internal/index.js"
	import AlternateLinks from "./AlternateLinks.svelte"
	import { createLangCookie } from "./utils/cookie.js"

	/**
	 * Component props interface using Svelte 5's $props
	 * @property {T | undefined} languageTag - Override the language detection with a specific language tag
	 * @property {I18n<T>} i18n - The routing instance created with `createI18n()` from `@inlang/paraglide-sveltekit`
	 */
	 const { languageTag, i18n, children } = $props<{
		languageTag?: T;
		i18n: I18n<T>;
		children?: () => any
	}>()
	
	// The base path may be relative during SSR.
	// To make sure it is absolute, we need to resolve it against the current page URL.
	const absoluteBase = $derived(normaliseBase(maybe_relative_base, new URL($page.url)) || "/");

	const lang = $derived(languageTag ?? i18n.getLanguageFromUrl($page.url));

	// the effect needs to run before the DOM updates
	// otherwise, the message function will render a
	// stale language (becaus runtime.setLanguageTag)
	// has not been called yet.
	$effect.pre(() => {
		if (browser) {
			i18n.config.runtime.setLanguageTag(lang);
			document.documentElement.lang = lang;
			document.documentElement.dir = i18n.config.textDirection[lang] ?? "ltr";
		}
	});

	let numberOfLanugageChanges = 0;
	$effect(() => {
		if (lang) {
			numberOfLanugageChanges += 1;
		}
	});

	// on all but the first language change, invalidate language-dependent data
	// the development mode always performs csr, therefore invalidate immediately
	$effect(() => {
		if (browser && lang && (numberOfLanugageChanges > 1 || dev)) {
			invalidate(LANGUAGE_CHANGE_INVALIDATION_KEY);
		}
	});

	function translateHref(href: string, hreflang: T | undefined): string {
		try {
			const localisedCurrentUrl = new URL(get(page).url)
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

	setParaglideContext({ translateHref });

	$effect(() => {
		if (browser) document.cookie = createLangCookie(lang, absoluteBase);
	});
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
{#key lang}
	{@render children?.()}
{/key}
