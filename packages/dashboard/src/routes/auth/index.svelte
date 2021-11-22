<script lang="ts" context="module">
	import { auth } from '$lib/services/auth';
	import type { LoadOutput } from '@sveltejs/kit';

	export async function load(): Promise<LoadOutput> {
		// user is already logged in
		if (auth.session()) {
			return {
				status: 302,
				redirect: '/project'
			};
		}
		return {};
	}
</script>

<script lang="ts">
	import { Button, TextInput, Tile } from 'carbon-components-svelte';
	import { PostgrestError } from '@supabase/postgrest-js';
	import { isValidEmail } from '$lib/utils/isValidEmail';
	import LogoGithub32 from "carbon-icons-svelte/lib/LogoGithub32";
	import LogoGoogle32 from "carbon-icons-svelte/lib/LogoGoogle32";

	let email = '';
	let showMagicLogin = false

	$: inputIsValidEmail = isValidEmail(email);

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

	async function handleGoogleLogin() {
		// todo
	}
	
	function handleShowMagicLink() {
		showMagicLogin = !showMagicLogin;
	}
</script>


<div>
	<column class="space-y-2 w-80 m-5">
		<h1>Login</h1>
		<p class="text-gray-600 text-sm">Don't have an account? <button class="text-blue-600 underline" on:click={handleShowMagicLink}>Sign in with magic link</button></p>
		<!-- MAGIC LINK SIGN IN -->
		{#if showMagicLogin}
		<Tile class="space-y-2">
			<TextInput type="email" bind:value={email} placeholder="your e-mail"/>
			<Button class="w-full" disabled={inputIsValidEmail === false} kind="primary" on:click={handleLogin}
				>Send Magic Link</Button
			>
		</Tile>
		<hr style="height:2px;border-width:0;color:gray;background-color:lightgray;margin-top:1.5em;margin-bottom:1em;">
		{/if}
		<!-- GITHUB SIGN IN -->
		<Button kind="primary" class="w-full justify-start" on:click={handleGithubLogin} icon={LogoGithub32}>
			Sign in with GitHub
		</Button>
		<!-- GOOGLE SIGN IN -->
		<Button disabled kind="tertiary" class="w-full justify-start" on:click={handleGoogleLogin} icon={LogoGoogle32}>
			Sign in with Google
		</Button>	
	</column>
</div>