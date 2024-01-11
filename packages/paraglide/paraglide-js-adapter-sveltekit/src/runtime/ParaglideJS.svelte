<!--
	@component
	Automatically detect and manage the language of your page.
	It also adds `<link rel="alternate">` tags to the head of your page
-->
<script>
	import { page } from "$app/stores"
	import { browser } from "$app/environment"
	import { getHrefBetween } from "./utils/diff-urls.js"
	import { setContext } from "svelte"
	import { PARAGLIDE_CONTEXT_KEY } from "../constants.js"
	import { base } from "$app/paths"
	import * as Path from "./utils/path.js"

	/** 
	 * The Paraglide runtime from the Paraglide compiler output.
	 * Import it and pass it to this component.
	 * 
	 * @example
	 * ```ts
	 * import * as runtime from "../paraglide/runtime.js"
	 * <ParaglideJS {runtime} />
	 * ```
	 * 
	 * @type {import("./runtime.js").Paraglide<any>}
	 */
	export let runtime; 

	/** 
	 * Override the language detection with a specific language tag.
	 * @type { string | undefined } 
	 */
	export let languageTag = undefined

	/** @type {import("./translate-paths/path-translations.js").PathTranslations}*/
	export let paths  = {};

	$: lang = languageTag ?? runtime.sourceLanguageTag
	$: runtime.setLanguageTag(lang)
	$: if(browser) document.documentElement.lang = lang

	/**
	 * Translate the Path based on the current language.
	 * 
	 * @param {URL} url
	 * @param {string} lang
	 * @returns {URL}
	 */
	function translateUrl(url, lang) {
		if($page.url.origin !== url.origin) return url
		if(!url.pathname.startsWith(base)) return url

		const path = url.pathname.slice(base.length)

		const pathTranslations = paths[path];
		if(pathTranslations) {
			const translatedPath = pathTranslations[lang]
			if(translatedPath) {
				url.pathname = Path.resolve(base, lang, translatedPath);
				return url;
			}		
		}

		url.pathname = Path.resolve(base, lang ,path);
		return url;
	}

	/**
	 * 
	 * @param {string} pathWithBase
	 * @returns {{ lang: string; path: string }}
	 */
	function parsePathWithLanguage(pathWithBase) {
		const pathWithLanguage = pathWithBase.slice(base.length)
		const [lang, ...parts] = pathWithLanguage.split("/").filter(Boolean)

		const path = normalizePath(parts.join("/"))

		return lang
			? {
					lang,
					path,
			}
			: {
					lang: "",
					path: "/",
			}
	}


	/**
	 * Always starts with a slash and never ends with a slash.
	 * @param {string} path
	 */
	function normalizePath(path) {
		if (!path.startsWith("/")) path = "/" + path
		if (path.endsWith("/")) path = path.slice(0, -1)
		return path
	}


	/** 
	 * @param {string} href
	 * @param {string | undefined} hreflang
	 * @returns {string}
	 */
	function translateHref(href, hreflang) {
		const from = new URL($page.url)
		const original_to = new URL(href, new URL(from))
		
		const lang = hreflang ?? parsePathWithLanguage(from.pathname).lang;
		const to = translateUrl(original_to, lang)
		return getHrefBetween(from, to)
	}


	setContext(PARAGLIDE_CONTEXT_KEY, {
		runtime,
		translateHref
	})
</script>

<svelte:head>
	<!-- If there is more than one language, add alternate links -->
	{#if runtime.availableLanguageTags.length >= 1}
		{#each runtime.availableLanguageTags as lang}
			<link rel="alternate" hreflang={lang} href={translateHref($page.url.pathname, lang)} />
		{/each}
	{/if}
</svelte:head>

<!-- Trigger a Re-Render whenever the language changes -->
{#key lang}
	<slot />
{/key}
