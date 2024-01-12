<!--
	@component
	Automatically detect and manage the language of your page.
	It also adds `<link rel="alternate">` tags to the head of your page
-->
<script>
	import { page } from "$app/stores"
	import { browser } from "$app/environment"
	import { setContext } from "svelte"
	import { PARAGLIDE_CONTEXT_KEY } from "./constants.js"
	import { base } from "$app/paths"
	import * as Path from "./utils/path.js"
	import { isExternal } from "./utils/external.js"
	import { getTranslatedPath } from "./translate-paths/getTranslatedPath.js"
	import { parsePath } from "./utils/parse-path.js"
	import { getCanonicalPath } from "./translate-paths/getCanonicalPath.js"
	import { translatePath } from "./translate-paths/translatePath.js"

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

	/** @type {import("./translate-paths/path-translations.js").PathTranslations<string>}*/
	export let paths  = {};

	$: lang = languageTag ?? runtime.sourceLanguageTag
	$: runtime.setLanguageTag(lang)
	$: if(browser) document.documentElement.lang = lang

	/** 
	 * @param {string} href
	 * @param {string | undefined} hreflang
	 * @returns {string}
	 */
	function translateHref(href, hreflang) {
		const from = new URL($page.url)
		const original_to = new URL(href, new URL(from))
		
		if(isExternal(original_to, from, base)) 
			return href;

		const { lang: fromLang } = parsePath(from.pathname, { 
			base, 
			availableLanguageTags: runtime.availableLanguageTags,
			defaultLanguageTag: runtime.sourceLanguageTag
		})

		const lang = hreflang ?? fromLang;
		const canonicalPath = original_to.pathname.slice(base.length);

		const translatedPath = getTranslatedPath(canonicalPath, lang, paths);
		const fullPath = Path.resolve(base, lang, translatedPath);

		return fullPath;
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
			<link rel="alternate" hreflang={lang} href={
			translatePath(
				$page.url.pathname, 
				lang, 
				paths, 
				{ 
					base, 
					availableLanguageTags: runtime.availableLanguageTags, 
					defaultLanguageTag: runtime.sourceLanguageTag
				}
			)} />
		{/each}
	{/if}
</svelte:head>

<!-- Trigger a Re-Render whenever the language changes -->
{#key lang}
	<slot />
{/key}
