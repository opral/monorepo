<!-- 
    CURRENTLY NOT USED

    Row level security is not setup in local database. Thus, 
    auth is not neccessary (...and auth.signIn results in a CORS error.)
-->
<script lang="ts">
	import Center from '$lib/components/Center.svelte';

	import { auth } from '$lib/services/auth';

	import { Button, TextInput } from 'carbon-components-svelte';

	let password: string = '';

	async function handleDevLogin() {
		const signIn = await auth.signIn({ email: 'dev@inlang.dev', password: password });
		if (signIn.error) {
			// dev account might now exist in local database yet
			const signUp = await auth.signUp({ email: 'dev@inlang.dev', password: password });
			if (signUp.error) {
				alert(signUp.error);
			}
		}
	}
</script>

<Center>
	<TextInput bind:value={password} labelText="Password" placeholder="Enter password" />
	<Button disabled={password === ''} on:click={handleDevLogin}>Submit</Button>
</Center>
