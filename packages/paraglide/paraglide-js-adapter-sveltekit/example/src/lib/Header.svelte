<script lang="ts">
	import { page } from "$app/stores"
    import { availableLanguageTags, sourceLanguageTag } from "$paraglide/runtime"
	import { getPathWithoutLang, translatePath } from "./i18n"

    $: pathWithoutLang = getPathWithoutLang($page.url.pathname);
</script>

<svelte:head>
    {#each availableLanguageTags as lang}
        <link rel="alternate" hreflang={lang} href={translatePath(pathWithoutLang, lang)} />
    {/each}
</svelte:head>
