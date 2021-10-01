<script lang="ts">
	import { auth } from '$lib/services/auth';

	import { CodeSnippet } from 'carbon-components-svelte';
	import { onMount } from 'svelte';

	let token = '';

	onMount(async () => {
		token = auth.session().access_token;
	});
</script>

<p>Copy the token</p>
<CodeSnippet bind:code={token} />

<!-- app.inlang.dev/auth/cli-token -->
