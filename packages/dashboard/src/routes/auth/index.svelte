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
	import LogoFacebook32 from "carbon-icons-svelte/lib/LogoFacebook32";
	import LogoDiscord32 from "carbon-icons-svelte/lib/LogoDiscord32";
	import MagicWand32 from "carbon-icons-svelte/lib/MagicWandFilled32";
	import Send32 from "carbon-icons-svelte/lib/SendFilled32";

	let email = '';
	let showMagicLogin = false;

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

	function handleShowMagicLogin() {
		showMagicLogin = !showMagicLogin
	}
	
</script>

<div class="flex items-center h-screen absolute top-0">
<column class="space-y-2 w-80 m-5">
	<h1>Log in</h1>
	<p class="text-gray-600 text-xs">An account is automatically created when you log in. No need to register.</p>

	<hr style="height:2px;border-width:0;color:gray;background-color:lightgray;margin-top:3em;margin-bottom:1em;">

	<!-- GITHUB LOG IN -->
	<p class="text-gray-600 text-xs">Social Auth Logins</p>
	<Button kind="primary" class="w-full justify-start" on:click={handleGithubLogin} icon={LogoGithub32}>
		Log in with GitHub
	</Button>
	<div class="h-2"></div>
	<p class="text-gray-600 text-xs">Coming soon</p>
	<!-- GGOOGLE LOG IN -->
	<Button disabled kind="tertiary" class="w-full justify-start" on:click={handleGoogleLogin} icon={LogoGoogle32} >
		Log in with Google
	</Button>
	<!-- FACEBOOK LOG IN -->
	<Button disabled kind="tertiary" class="w-full justify-start" on:click={handleGoogleLogin} icon={LogoFacebook32} >
		Log in with Facebook
	</Button>
	<!-- DISCORD LOG IN -->
	<Button disabled kind="tertiary" class="w-full justify-start" on:click={handleGoogleLogin} icon={LogoDiscord32} >
		Log in with Discord
	</Button>

	<hr style="height:2px;border-width:0;color:gray;background-color:lightgray;margin-top:3em;margin-bottom:1em;">

	<p class="text-gray-600 text-xs">Alternative logins</p>

	<!-- MAGIC LINK LOG IN -->
	<Button kind="tertiary" class="w-full justify-start" on:click={handleShowMagicLogin} icon={MagicWand32}>Log in with Magic Link</Button>
	{#if showMagicLogin}
	<TextInput type="email" bind:value={email} placeholder="your e-mail"/>
	<Button class="w-full" disabled={inputIsValidEmail === false} kind="primary" on:click={handleLogin} icon={Send32}>
		Send Magic Link
	</Button>
	{/if}

	<hr style="height:2px;border-width:0;color:gray;background-color:lightgray;margin-top:3em;margin-bottom:0.5em;">

	<p class="text-gray-600 text-sm">Need help? <a class="text-blue-600 underline" href="https://discord.com/invite/CUkj4fgz5K" target="_blank">join our discord</a></p>
</column>
</div>