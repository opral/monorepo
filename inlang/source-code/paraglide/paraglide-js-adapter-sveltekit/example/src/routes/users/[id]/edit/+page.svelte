<script>
	import { base } from '$app/paths'
    import { page } from '$app/stores';
    import * as m from '$paraglide/messages.js';
	import { availableLanguageTags } from '$paraglide/runtime'
</script>

<h1>{$page.params.id}</h1>


<h2>{base}</h2>

{#each availableLanguageTags as lang}
    <a href="{base}/users/{$page.params.id}/edit" hreflang={lang}>
    {m.change_language_to({ languageTag: lang })}
    </a>
    <br />
{/each}

