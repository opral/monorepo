<script>
	import { enhance } from "$app/forms"
import { page } from "$app/stores"
    import * as m from "$lib/paraglide/messages.js"

    $: userId = Number.parseFloat($page.params.id);
</script>

<h1>{m.edit_user({ userId })}</h1>
<a href="/users/{userId}">{m.users()}</a>

<form method="POST" action="?/create" use:enhance>
    <label for="name">Name</label>
    <button>Submit</button>
</form>