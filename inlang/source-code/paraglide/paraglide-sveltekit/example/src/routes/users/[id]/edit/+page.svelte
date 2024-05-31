<script>
	import { page } from "$app/stores"
    import * as m from "$lib/paraglide/messages.js"

    $: userId = Number.parseFloat($page.params.id);
</script>

<h1>{m.edit_user({ userId })}</h1>
<a href="/users/{userId}">{m.users()}</a>