<script lang="ts" generics="T extends string">
	import type { RoutingStrategy } from './strategy.js'
    import { page } from '$app/stores'
	import { normaliseBase } from './utils/normaliseBase.js'
    import { base as maybe_relative_base } from "$app/paths"
	import { parseRoute, serializeRoute } from './utils/route.js'

    const absoluteBase = normaliseBase(maybe_relative_base, new URL($page.url)) || "/"

    export let availableLanguageTags : readonly T[]
    export let strategy: RoutingStrategy<T>
    export let currentLang : T

    const getAlternateLinks = (canonicalPath: string, strategy: RoutingStrategy<T>) => {
        const links : string[] = [];
        for(const lang of availableLanguageTags) {
            const localisedPath = strategy.getLocalisedPath(canonicalPath, lang)
            const fullPath = serializeRoute(localisedPath, absoluteBase, undefined)

            const link = new URL(fullPath, new URL($page.url)).href
            links.push(link) 
        }
        return links;
    }

    $: localisedPath = parseRoute($page.url.pathname, absoluteBase)[0];
    $: canonicalPath = strategy.getCanonicalPath(localisedPath, currentLang)
    $: alternateLinks = getAlternateLinks(canonicalPath, strategy)
</script>

<!-- If there is more than one language, add alternate links -->
{#if availableLanguageTags.length >= 1}
    {#each alternateLinks as href, i}
        <link rel="alternate" hreflang={availableLanguageTags[i]} href={href} />
    {/each}
{/if}