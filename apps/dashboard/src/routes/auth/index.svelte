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
	import { Button, OutboundLink, TextInput } from 'carbon-components-svelte';
	import { PostgrestError } from '@supabase/postgrest-js';
	import { isValidEmail } from '$lib/utils/isValidEmail';
	import LogoGithub32 from 'carbon-icons-svelte/lib/LogoGithub32';
	import Send32 from 'carbon-icons-svelte/lib/SendFilled32';
	import Divider from '$lib/layout/Divider.svelte';

	let email = '';

	$: inputIsValidEmail = isValidEmail(email);

	async function handleLogin(): Promise<void> {
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

	async function handleGithubLogin(): Promise<void> {
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

<div class="flex items-center h-screen absolute top-0">
	<column class="space-y-2 w-80 m-5">
		<h1>Log in</h1>
		<p class="text-gray-600 text-xs">
			An account is automatically created when you log in. There is no need to explicitly register.
		</p>
		<Divider />
		<!-- GITHUB LOG IN -->
		<p class="text-gray-600 text-xs">Social Auth Login</p>
		<Button
			kind="primary"
			class="w-full justify-start"
			on:click={handleGithubLogin}
			icon={LogoGithub32}
		>
			Log in with GitHub
		</Button>
		<!-- <div class="h-2"></div>
	<p class="text-gray-600 text-xs">Coming soon</p>
	<Button disabled kind="tertiary" class="w-full justify-start" on:click={handleGoogleLogin} icon={LogoGoogle32} >
		Log in with Google
	</Button>
	<Button disabled kind="tertiary" class="w-full justify-start" on:click={handleGoogleLogin} icon={LogoFacebook32} >
		Log in with Facebook
	</Button>
	<Button disabled kind="tertiary" class="w-full justify-start" on:click={handleGoogleLogin} icon={LogoDiscord32} >
		Log in with Discord
	</Button> -->
		<Divider />
		<p class="text-gray-600 text-xs">Log in with email</p>
		<!-- MAGIC LINK LOG IN -->
		<TextInput type="email" bind:value={email} placeholder="your e-mail" />
		<Button
			class="w-full"
			disabled={inputIsValidEmail === false}
			kind="primary"
			on:click={handleLogin}
			icon={Send32}
		>
			Send login link
		</Button>
		<Divider />
		<p class="text-gray-600 text-sm">
			Need help?
			<OutboundLink href="https://discord.com/invite/CUkj4fgz5K">Join our Discord</OutboundLink>
		</p>
	</column>
</div>
