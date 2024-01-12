<script>
	import { page } from "$app/stores"
	import { availableLanguageTags } from "$paraglide/runtime"
    import * as m from "$paraglide/messages.js"
</script>

<h1>User {$page.params.id}</h1>

<a data-sveltekit-keepfocus href="/base/users/{Number($page.params.id) + 1}">Next User</a>

{#each availableLanguageTags as lang}
    <a href="/base/users/{Number($page.params.id)}" hreflang={lang}>
    {m.change_language_to({ languageTag: lang })}
    </a>
    <br />
{/each}

