<script>
	import { page } from "$app/stores"
	import { availableLanguageTags } from "$paraglide/runtime"
    import * as m from "$paraglide/messages.js"

    const totalUsers = 10;

    $: num_users = Number.parseInt($page.params.id);

    $: next = (num_users + 1) % totalUsers;
    $: prev = (num_users - 1 + totalUsers) % totalUsers;
</script>

<h1>{m.users()} {num_users}</h1>

<a data-sveltekit-keepfocus href="/base/users/{prev}">{m.previous_user()}</a>
<br />
<a data-sveltekit-keepfocus href="/base/users/{next}">{m.next_user()}</a>


<br />
<br />
{#each availableLanguageTags as lang}
    <a href="/base/users/{num_users}" hreflang={lang}>
    {m.change_language_to({ languageTag: lang })}
    </a>
    <br />
{/each}

