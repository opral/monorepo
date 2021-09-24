<script lang="ts" context="module">
	import { auth } from '$lib/services/auth';
	import type { LoadInput, LoadOutput } from '@sveltejs/kit';

	export async function load({}: LoadInput): Promise<LoadOutput> {
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
	import { Button, InlineLoading, TextInput, Tile } from 'carbon-components-svelte';

	let loading = false;
	let email = '';

	$: isValidEmail = () => {
		if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
			return true;
		}
		return false;
	};

	const handleLogin = async () => {
		try {
			loading = true;
			const { error } = await auth.signIn(
				{ email },
				{
					redirectTo: import.meta.env.VITE_PUBLIC_AUTH_REDIRECT_URL as string
				}
			);
			if (error) throw error;
			alert('Check your email for the login link!');
		} catch (error) {
			// @ts-ignore
			alert(error.error_description || error.message);
		} finally {
			loading = false;
		}
	};
</script>

<div class="w-full h-screen">
	<Center>
		<Tile>
			<div class="col-6 form-widget">
				<h1 class="header mb-4">Login</h1>
				<p class="description mb-2">Sign in via magic link with your email below:</p>
				<TextInput type="email" bind:value={email} placeholder="your e-mail" />
				<Button disabled={!isValidEmail()} class="mt-4" on:click={handleLogin}>
					{#if loading}
						<InlineLoading />
					{:else}
						Send Magic Link
					{/if}
				</Button>
			</div>
		</Tile>
	</Center>
</div>
