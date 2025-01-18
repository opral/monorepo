<script>
	import { page } from "$app/stores"
    import { base, resolveRoute } from "$app/paths"
    import * as m from "$lib/paraglide/messages.js"

    const totalUsers = 10;

    $: num_users = Number.parseFloat($page.params.id);

    $: next = (num_users + 1) % totalUsers;
    $: prev = (num_users - 1 + totalUsers) % totalUsers;
</script>

<h1>{m.users()} {num_users}</h1>

<a data-sveltekit-keepfocus href="{base}/users/{prev}">{m.previous_user()}</a>
<br />
<a data-sveltekit-keepfocus href="{base}/users/{next}">{m.next_user()}</a>

<br />
<br />

<a href={resolveRoute("/users/[id]/edit/", { id: num_users.toString() })}>{m.edit_user({ userId: num_users })}</a>