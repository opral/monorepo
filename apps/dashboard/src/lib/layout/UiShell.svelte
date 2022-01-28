<script lang="ts">
	import { auth } from '$lib/services/auth';
	import Logout20 from 'carbon-icons-svelte/lib/Logout20';
	import { PostgrestError } from '@supabase/postgrest-js';
	import UserAvatar20 from 'carbon-icons-svelte/lib/UserAvatar20';

	import {
		Header,
		HeaderNav,
		HeaderPanelLinks,
		HeaderAction,
		HeaderPanelLink,
		SkipToContent,
		HeaderUtilities,
		Content,
		HeaderNavItem
	} from 'carbon-components-svelte';
	import { userStore } from '$lib/stores/userStore';
	import { page } from '$app/stores';
	import ProjectSideNav from './ProjectSideNav.svelte';
	import { projectStore } from '$lib/stores/projectStore';
	import { brombTriggerLink } from '$lib/services/bromb';

	let isSideNavOpen = false;

	let projectName: () => string;
	$: projectName = () => {
		if ($page.params.projectId && $projectStore.data?.project) {
			return $projectStore.data.project.name;
		}
		// return empty string. returning undefined does not work
		return '';
	};

	async function handleLogout(): Promise<void> {
		try {
			const { error } = await auth.signOut();
			if (error) {
				alert(error);
			}
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
		<HeaderNav>
			<HeaderNavItem
				href={'https://inlang.dev/docs/getting-started'}
				target="_blank"
				text="Documentation"
			/>
			<HeaderNavItem
				href={'https://projectfluent.org/fluent/guide/text.html'}
				target="_blank"
				text="Syntax Guide"
			/>
			<HeaderNavItem href={brombTriggerLink({})} text="Feedback on this site?" />
		</HeaderNav>
		<HeaderUtilities>
			<HeaderAction icon={UserAvatar20}>
				<HeaderPanelLinks>
					<h3 class="px-4 pb-4">{auth.user()?.email}</h3>
					<HeaderPanelLink>
						<row class="justify-between items-center" on:click={handleLogout}>
							Sign Out
							<Logout20 class="h-4" />
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
