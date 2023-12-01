import { OUTDIR_ALIAS, TRANSLATE_PATH_MODULE_ID } from "../constants.js"
import dedent from "dedent"

const code = dedent`
    <script>
        import { availableLanguageTags } from "${OUTDIR_ALIAS}/runtime.js"
        import translatePath from "${TRANSLATE_PATH_MODULE_ID}"
        import { page } from "$app/stores"
    </script>

    <svelte:head>
        {#each availableLanguageTags as lang}
            <link rel="alternate" hreflang={lang} href={translatePath($page.url.pathname, lang)} />
        {/each}
    </svelte:head>
`

export function getHeaderComponentCode(): string {
	return code
}
