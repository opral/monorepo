<!--
	@component
	Automatically detect and manage the language of your page.
	It also adds `<link rel="alternate">` tags to the head of your page
-->
<script>
	import { page } from "$app/stores"
	import { browser } from "$app/environment"
	import { setContext } from "svelte"
	import { PARAGLIDE_CONTEXT_KEY } from "../constants.js"

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

	$: lang = languageTag ?? runtime.sourceLanguageTag
	$: runtime.setLanguageTag(lang)
	$: if(browser) document.documentElement.lang = lang


		const translatePath = x => x;
</script>

<svelte:head>
	<!-- If there is more than one language, add alternate links -->
	{#if runtime.availableLanguageTags.length >= 1}
		{#each runtime.availableLanguageTags as lang}
			<link rel="alternate" hreflang={lang} href={translatePath($page.url.pathname, lang)} />
		{/each}
	{/if}
</svelte:head>

<!-- Trigger a Re-Render whenever the language changes -->
{#key lang}
	<slot />
{/key}
