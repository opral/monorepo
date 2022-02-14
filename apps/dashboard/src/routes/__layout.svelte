<script context="module" lang="ts">
	import { loadResources } from '$lib/services/i18n';
	import type { LoadInput, LoadOutput } from '@sveltejs/kit';
	export async function load({ fetch }: LoadInput): Promise<LoadOutput> {
		// fetching the translations with sveltekits load function https://kit.svelte.dev/docs/migrating#pages-and-layouts-preload
		await loadResources({ fetch });
		return {
			status: 200
		};
	}
</script>

<!-- 
	This layout acts as authentification layer. 
-->
<script lang="ts">
	import { capitalize, last } from 'lodash-es';
	import '../app.postcss';
	import { auth } from '$lib/services/auth';
	import { browser } from '$app/env';
	import { goto } from '$app/navigation';
	import UiShell from '$lib/layout/UiShell.svelte';
	import { page } from '$app/stores';
	import { InlineNotification } from 'carbon-components-svelte';
	import { analytics } from '$lib/services/analytics';
	import { env } from '$lib/env';
	import { t } from '$lib/services/i18n';

	$: outerWidth = 0;

	// initialize analytics if token is defined and is production
	if (env.VITE_PUBLIC_POSTHOG_TOKEN && env.VITE_IS_DEVELOPMENT !== false) {
		analytics.init(env.VITE_PUBLIC_POSTHOG_TOKEN, { api_host: env.VITE_PUBLIC_POSTHOG_API_HOST });
	}

	// check whether a user exists / is logged in
	const user = auth.user();
	// includes('auth') ensures that subroutes within /auth do not
	// lead to constant redirects
	if (user === null && $page.url.href.includes('auth') === false) {
		goto('auth');
	}

	if (user) {
		analytics.identify(user.id, { email: user.email });
	}

	if (browser) {
		auth.onAuthStateChange((event) => {
			if (event === 'SIGNED_IN') {
				goto('/');
			} else if (event === 'SIGNED_OUT') {
				goto('/auth');
			}
		});
	}
</script>

<svelte:head>
	{#if $page.params.projectId}
		<title>inlang | {capitalize(last($page.url.href.split('/')))}</title>
	{:else}
		<title>inlang</title>
	{/if}
</svelte:head>

<svelte:window bind:outerWidth />

<UiShell>
	<slot />
	{#if outerWidth < 550}
		<InlineNotification
			kind="warning"
			title="Notice:"
			subtitle={$t('warning.no-optimized-for-mobile')}
			hideCloseButton={false}
		/>
	{/if}
</UiShell>
