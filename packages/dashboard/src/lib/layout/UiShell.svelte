<script lang="ts">
	import { auth } from '$lib/services/auth';
	import Logout32 from 'carbon-icons-svelte/lib/Logout32';
	import { PostgrestError } from '@supabase/postgrest-js';
	import {
		Header,
		HeaderNav,
		HeaderPanelLinks,
		HeaderAction,
		HeaderPanelLink,
		SkipToContent,
		HeaderUtilities,
		Content,
		HeaderPanelDivider
	} from 'carbon-components-svelte';
	import { userStore } from '$lib/stores/userStore';
	import { page } from '$app/stores';
	import ProjectSideNav from './ProjectSideNav.svelte';
	import { projectStore } from '$lib/stores/projectStore';

	let isSideNavOpen = false;

	let projectName: () => string | undefined;
	$: projectName = () => {
		if ($page.params.projectId && $projectStore.data?.project) {
			return $projectStore.data.project.name;
		}
		return undefined;
	};

	async function handleLogout() {
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
	}
</script>

<Header company="inlang" href="/" bind:isSideNavOpen platformName={projectName()}>
	<div slot="skip-to-content">
		<SkipToContent />
	</div>
	{#if $userStore.data}
		<HeaderNav />
		<HeaderUtilities>
			<HeaderAction>
				<HeaderPanelLinks>
					<HeaderPanelLink href="/organization">Organizations</HeaderPanelLink>
					<HeaderPanelLink href="/project">Projects</HeaderPanelLink>
					<HeaderPanelDivider>Account</HeaderPanelDivider>
					<HeaderPanelLink>
						<row class="justify-between items-center" on:click={handleLogout}>
							Sign Out
							<Logout32 class="h-4" />
						</row>
					</HeaderPanelLink>
				</HeaderPanelLinks>
			</HeaderAction>
		</HeaderUtilities>
	{/if}
</Header>

{#if $page.params.projectId}
	<ProjectSideNav bind:isOpen={isSideNavOpen} />
{/if}

<Content>
	<slot />
</Content>
