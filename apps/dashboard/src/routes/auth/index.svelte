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
	import { env } from '$lib/env';
	import { PostgrestError } from '@supabase/postgrest-js';
	import { isValidEmail } from '$lib/utils/isValidEmail';
	import LogoGithub32 from 'carbon-icons-svelte/lib/LogoGithub32';
	import Send32 from 'carbon-icons-svelte/lib/SendFilled32';
	import Divider from '$lib/layout/Divider.svelte';
	import { t } from '$lib/services/i18n';
	let email = '';

	$: inputIsValidEmail = isValidEmail(email);

	async function handleLogin(): Promise<void> {
		try {
			const { error } = await auth.signIn(
				{ email },
				{
					redirectTo: env.VITE_PUBLIC_AUTH_REDIRECT_URL
				}
			);
			if (error) {
				throw error;
			}
			alert($t('login.check-email'));
		} catch (error) {
			const err = error as PostgrestError;
			alert(err.message);
		}
	}

	/**
	 * Login for development purposes.
	 */
	async function handleDevLogin(): Promise<void> {
		const signIn = await auth.signIn({ email: 'dev@account.com', password: 'dev@account.com' });
		if (signIn.error) {
			alert(signIn.error.message);
		}
	}

	async function handleGithubLogin(): Promise<void> {
		const { error } = await auth.signIn(
			{
				provider: 'github'
			},
			{ redirectTo: env.VITE_PUBLIC_AUTH_REDIRECT_URL }
		);
		if (error) {
			alert(error);
		}
	}
</script>

<div class="flex items-center h-screen absolute top-0">
	<column class="space-y-2 w-80 m-5">
		<h1>{$t('login.log-in')}</h1>
		<p class="text-gray-600 text-xs">
			{$t('login.account-auto-created')}
		</p>
		<Divider />
		{#if env.VITE_IS_DEVELOPMENT}
			<p class="text-gray-600 text-xs">DEVELOPMENT LOGIN</p>
			<Button class="w-full justify-start" on:click={handleDevLogin} kind="primary">
				Login with mock account
			</Button>
			<p class="text-danger">
				The social auth methods below most likely do not work in the dev environment!
			</p>
			<Divider />
		{/if}
		<!-- GITHUB LOG IN -->
		<p class="text-gray-600 text-xs">{$t('login.social-auth')}</p>
		<Button
			kind="tertiary"
			class="w-full justify-start"
			on:click={handleGithubLogin}
			icon={LogoGithub32}
		>
			{$t('login.github')}
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
		<p class="text-gray-600 text-xs">{$t('login.email')}</p>
		<!-- MAGIC LINK LOG IN -->
		<TextInput type="email" bind:value={email} placeholder={$t('login.enter-mail')} />
		<Button
			class="w-full"
			disabled={inputIsValidEmail === false}
			kind="primary"
			on:click={handleLogin}
			icon={Send32}
		>
			{$t('login.send-magic-link')}
		</Button>
		<Divider />
		<p class="text-gray-600 text-sm">
			{$t('login.need-help')}
			<OutboundLink href="https://discord.com/invite/CUkj4fgz5K"
				>{$t('login.join-discord')}
			</OutboundLink>
		</p>
	</column>
</div>
