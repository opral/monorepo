<script>
	import { page } from "$app/stores"

    $: User = Number.parseFloat($page.params.id);
</script>

<h1>Edit User {User}</h1>