<!-- 
	This layout acts as authentification layer. 
-->
<script lang="ts" context="module">
	import '../app.postcss';
	import { auth } from '$lib/services/auth';
	import type { LoadInput, LoadOutput } from '@sveltejs/kit';
	import { browser } from '$app/env';
	import { goto } from '$app/navigation';
	import UiShell from '$lib/layout/UiShell.svelte';
	import { page } from '$app/stores';
	import Tracker from '@openreplay/tracker';
	import { openreplayKey } from '$lib/services/replay';

	const tracker = new Tracker({ projectKey: openreplayKey });

	export async function load({ page }: LoadInput): Promise<LoadOutput> {
		const user = auth.user();
		// includes('auth') ensures that subroutes within /auth do not
		// lead to constant redirects
		if (user === null && page.path.includes('auth') === false) {
			return {
				status: 302,
				redirect: '/auth'
			};
		}
		return {};
	}
</script>

<script lang="ts">
	import { capitalize, last } from 'lodash-es';
	// if running in browser (not server side)
	// listen for auth changes

	if (browser) {
		auth.onAuthStateChange((event) => {
			if (event === 'SIGNED_IN') {
				tracker.start();
				tracker.setUserID(auth.user()?.email ?? 'Unknown');
				goto('/');
			} else if (event === 'SIGNED_OUT') {
				tracker.stop();
				goto('/auth');
			}
		});
	}
</script>

<svelte:head>
	<title>Inlang | {capitalize(last($page.path.split('/')))}</title>
</svelte:head>

<UiShell>
	<slot />
</UiShell>
