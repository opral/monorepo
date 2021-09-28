<!-- 
	This layout acts more or less solely as authentification layer. 
-->
<script lang="ts" context="module">
	import '../app.postcss';
	import Navbar from "./navbar.svelte";
	import ProjectSidenav from "$lib/layout/ProjectSidenav.svelte";
	// import { auth } from '$lib/services/auth';
	import type { LoadInput, LoadOutput } from '@sveltejs/kit';
	// import { browser } from '$app/env';
	// import { goto } from '$app/navigation';
	// import { upsertUser } from '$lib/services/database';

	export async function load({ page }: LoadInput): Promise<LoadOutput> {
		// const user = auth.user();
		// if (user) {
		// 	const { error } = await upsertUser(user);
		// 	if (error) {
		// 		throw error;
		// 	}
		// } else if (user === null && page.path !== '/auth') {
		// 	return {
		// 		status: 302,
		// 		redirect: '/auth'
		// 	};
		// }
		return {};
	}
</script>

<script lang="ts">
	// if running in browser (not server side)
	// listen for auth changes
	// if (browser) {
	// 	auth.onAuthStateChange((event, authSession) => {
	// 		if (event === 'SIGNED_IN') {
	// 			goto('/');
	// 		} else if (event === 'SIGNED_OUT') {
	// 			goto('/auth');
	// 		}
	// 	});
	// }


</script>
<Navbar username="test"/>
	<slot></slot>
