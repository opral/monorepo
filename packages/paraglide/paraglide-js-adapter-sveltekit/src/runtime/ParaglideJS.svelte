<script context="module">
	import translatePath from "$paraglide-adapter-sveltekit:translate-path"
	import getLanguage from "$paraglide-adapter-sveltekit:get-language"
	import { setLanguageTag, availableLanguageTags } from "$paraglide-adapter-sveltekit:runtime"
	import { page } from "$app/stores"
</script>

<script>
	$: lang = getLanguage($page.url)
	$: setLanguageTag(lang)
</script>

<svelte:head>
	{#if availableLanguageTags.length >= 1}
		{#each availableLanguageTags as lang}
			<link rel="alternate" hreflang={lang} href={translatePath($page.url.pathname, lang)} />
		{/each}
	{/if}
</svelte:head>

{#key lang}
	<slot />
{/key}
