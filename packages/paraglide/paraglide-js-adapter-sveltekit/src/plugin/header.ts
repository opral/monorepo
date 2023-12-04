import { OUTDIR_ALIAS, TRANSLATE_PATH_MODULE_ID } from "../constants.js"
import dedent from "dedent"


export function getHeaderComponentCode(excludeRegexes: RegExp[]): string {
	return dedent`
    <script>
        import { availableLanguageTags } from "${OUTDIR_ALIAS}/runtime.js"
        import translatePath from "${TRANSLATE_PATH_MODULE_ID}"
        import { page } from "$app/stores"

        //If the current path matches any of these regexes, don't generate alternate links
        const excludeRegexes = [${excludeRegexes.map((r) => `/${r.source}/`).join(", ")}];
        $: hasAlternateLinks = !excludeRegexes.some((regex) => regex.test($page.url.pathname))
    </script>

    <svelte:head>
        {#if hasAlternateLinks}
            {#each availableLanguageTags as lang}
                <link rel="alternate" hreflang={lang} href={translatePath($page.url.pathname, lang)} />
            {/each}
        {/if}
    </svelte:head>
`
}
