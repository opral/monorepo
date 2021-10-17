<script lang="ts">
	import UserAvatar32 from 'carbon-icons-svelte/lib/UserAvatar32';
	import User24 from 'carbon-icons-svelte/lib/User24';
	import Password32 from 'carbon-icons-svelte/lib/Password32';
	import { auth } from '$lib/services/auth';
	import Logout32 from 'carbon-icons-svelte/lib/Logout32';
	import { PostgrestError } from '@supabase/postgrest-js';
	import {
		Header,
		HeaderNav,
		HeaderPanelLinks,
		HeaderNavItem,
		HeaderAction,
		HeaderPanelLink,
		SkipToContent,
		HeaderUtilities
	} from 'carbon-components-svelte';
	import { userStore } from '$lib/stores/userStore';
	// export let avatar:
	let isSideNavOpen = false;

	const handleLogout = async () => {
		try {
			const { error } = await auth.signOut();
			if (error) {
				throw error;
			}
			alert('Logged out!');
		} catch (error) {
			const err = error as PostgrestError;
			alert(err.message);
		}
	};
</script>

<Header company="inlang" bind:isSideNavOpen href="/">
	<div slot="skip-to-content">
		<SkipToContent />
	</div>
	{#if $userStore.data}
		<HeaderNav>
			<HeaderNavItem href="/project" text="Projects" />
			<HeaderNavItem href="/organization" text="Organizations" />
		</HeaderNav>

		<HeaderUtilities>
			<HeaderAction
				text={$userStore.data.email}
				icon={User24}
				class="bx--header__global place-items-center flex-row-reverse"
			>
				<div class="bx--header-panel--expanded bx-switcher__item:nth-child(1)">
					<HeaderPanelLinks>
						<HeaderPanelLink href="/" class="bx--switcher__item" style="height: 40px"
							><div class="inline-flex">
								<UserAvatar32 class="mr-4 -mt-1" />Account
							</div></HeaderPanelLink
						>
						<HeaderPanelLink href="/" class="bx--switcher__item" style="height: 40px"
							><div class="inline-flex mb-4">
								<Password32 class="mr-4 -mt-0.5" />Access tokens
							</div></HeaderPanelLink
						>
						<HeaderPanelLink on:click={handleLogout} class="bx--switcher__item" style="height: 40px"
							><div class="inline-flex">
								<Logout32 class="mr-4 -mt-1" /> Log out
							</div></HeaderPanelLink
						>
					</HeaderPanelLinks>
				</div>
			</HeaderAction>
		</HeaderUtilities>
	{/if}
</Header>

<style>
	:global(.bx--header-panel--expanded) {
		width: 180px;
		height: 120px;
	}
	:global(.bx--switcher__item:nth-child(1)) {
		margin-top: 0px;
	}
	:global(.bx--switcher__item) {
		height: 40px;
	}
	:global(.s-dYWHY7G7-e5q) {
		width: 160px;
	}
</style>
