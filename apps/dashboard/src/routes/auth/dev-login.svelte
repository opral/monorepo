<!-- 
	Signs up or signs in as 'dev@inlang.dev' user. That email should
	correspond to the email used in seeding the database.

 -->
<script lang="ts">
	import { goto } from '$app/navigation';

	import Center from '$lib/components/Center.svelte';

	import { auth } from '$lib/services/auth';

	import { Button } from 'carbon-components-svelte';

	async function handleDevLogin(): Promise<void> {
		const signIn = await auth.signIn({ email: 'dev@account.com', password: 'dev@account.com' });
		if (signIn.error) {
			alert(signIn.error.message);
		} else if (signIn.user) {
			goto('/');
		}
	}
</script>

<Center>
	<Button on:click={handleDevLogin}>Sign in</Button>
</Center>
