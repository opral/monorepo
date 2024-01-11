<!--
	@component
	Automatically detect and manage the language of your page.

	It also adds `<link rel="alternate">` tags to the head of your page
-->
<script lang="ts">
	import translatePath from "$paraglide-adapter-sveltekit:translate-path"
	import getLanguage from "$paraglide-adapter-sveltekit:get-language"
	import { page } from "$app/stores"
	import { browser } from "$app/environment"

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

	$: lang = languageTag ?? getLanguage($page.url) ?? runtime.sourceLanguageTag
	$: runtime.setLanguageTag(lang)
	$: if(browser) document.documentElement.lang = lang
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
