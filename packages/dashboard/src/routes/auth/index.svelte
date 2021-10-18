<script lang="ts" context="module">
	import { auth } from '$lib/services/auth';
	import type { LoadOutput } from '@sveltejs/kit';

	export async function load(): Promise<LoadOutput> {
		// user is already logged in
		if (auth.session()) {
			return {
				status: 302,
				redirect: '/'
			};
		}
		return {};
	}
</script>

<script lang="ts">
	import Center from '$lib/components/Center.svelte';
	import { Button, TextInput, Tile } from 'carbon-components-svelte';
	import { PostgrestError } from '@supabase/postgrest-js';

	let email = '';

	$: isValidEmail = () => {
		if (/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
			return true;
		}
		return false;
	};

	async function handleLogin() {
		try {
			const { error } = await auth.signIn(
				{ email },
				{
					redirectTo: import.meta.env.VITE_PUBLIC_AUTH_REDIRECT_URL as string
				}
			);
			if (error) {
				throw error;
			}
			alert('Check your email for the login link!');
		} catch (error) {
			const err = error as PostgrestError;
			alert(err.message);
		}
	}

	async function handleGithubLogin() {
		const { error } = await auth.signIn(
			{
				provider: 'github'
			},
			{ redirectTo: import.meta.env.VITE_PUBLIC_AUTH_REDIRECT_URL as string }
		);
		if (error) {
			alert(error);
		}
	}
</script>

<Center>
	<Tile>
		<column class="space-y-2 w-72">
			<h1>Login</h1>
			<!-- MAGIC LINK -->
			<p class="description mb-2">Sign in via magic link by entering your email below:</p>
			<TextInput type="email" bind:value={email} placeholder="your e-mail" />
			<Button disabled={isValidEmail() === false} kind="primary" on:click={handleLogin}
				>Send Magic Link</Button
			>
			<!-- GITHUB SIGN IN -->
			<Button kind="primary" class="w-full justify-start" on:click={handleGithubLogin}>
				<img src="/github-icon.svg" alt="Github" class="h-6 pr-2 text-white fill-current" />
				Sign in with GitHub
			</Button>
		</column>
	</Tile>
</Center>
