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
	import { Button, TextInput } from 'carbon-components-svelte';
	import { PostgrestError } from '@supabase/postgrest-js';
	import { isValidEmail } from '$lib/utils/isValidEmail';
	import LogoGithub32 from "carbon-icons-svelte/lib/LogoGithub32";
	import LogoGoogle32 from "carbon-icons-svelte/lib/LogoGoogle32";
	import ArrowRight32 from "carbon-icons-svelte/lib/ArrowRight32";

	let email = '';

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
	
</script>

<div class="flex items-center h-full">
<column class="space-y-2 w-80 m-5">
	<h1>Log in</h1>
	<p class="text-gray-600 text-xs">By logging on with an external provider, your inlang account is automatically created</p>

	<hr style="height:2px;border-width:0;color:gray;background-color:lightgray;margin-top:3em;margin-bottom:1em;">

	<!-- GITHUB SIGN IN -->
	<Button kind="primary" class="w-full justify-start" on:click={handleGithubLogin} icon={LogoGithub32}>
		Log in with GitHub
	</Button>

	<hr style="height:2px;border-width:0;color:gray;background-color:lightgray;margin-top:3em;margin-bottom:1em;">

	<p class="text-gray-600 text-xs">Alternative logins</p>

	<!-- MAGIC LINK SIGN IN -->
	<TextInput type="email" bind:value={email} placeholder="your e-mail"/>
	<Button class="w-full" disabled={inputIsValidEmail === false} kind="primary" on:click={handleLogin} icon={ArrowRight32}>
		Log in with Magic Link
	</Button>
	
	<!-- GOOGLE SIGN IN -->
	<Button disabled kind="tertiary" class="w-full justify-start" on:click={handleGoogleLogin} icon={LogoGoogle32}>
		Log in with Google
	</Button>

	<hr style="height:2px;border-width:0;color:gray;background-color:lightgray;margin-top:3em;margin-bottom:0.5em;">

	<p class="text-gray-600 text-sm">Need help? <a class="text-blue-600 underline" href="https://discord.com/invite/CUkj4fgz5K" target="_blank">join our discord</a></p>
</column>
</div>