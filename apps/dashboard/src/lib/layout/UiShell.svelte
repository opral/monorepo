<script lang="ts">
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
	import { page } from '$app/stores';
	import UriSideNav from './UriSideNav.svelte';
	import { projectStore } from '$lib/stores/projectStore';
	import { brombTriggerLink } from '$lib/services/bromb';
	import { locale, t } from '$lib/services/i18n';
	import Language20 from 'carbon-icons-svelte/lib/Language20';

	let isSideNavOpen = false;

	let projectName: () => string;
	$: projectName = () => {
		if ($page.params.projectId && $projectStore.data?.project) {
			return $projectStore.data.project.name;
		}
		// return empty string. returning undefined does not work
		return '';
	};
</script>

<Header company="inlang" href="/" bind:isSideNavOpen platformName={projectName()}>
	<div slot="skip-to-content">
		<SkipToContent />
	</div>
	<HeaderNav>
		<HeaderNavItem
			href={'https://inlang.dev/docs/getting-started'}
			target="_blank"
			text={$t('generic.documentation')}
		/>
		<HeaderNavItem
			href={'https://projectfluent.org/fluent/guide/text.html'}
			target="_blank"
			text={$t('syntax-guide')}
		/>
		<HeaderNavItem href={brombTriggerLink({})} text={$t('feedback')} />
	</HeaderNav>
	<HeaderUtilities>
		<HeaderAction icon={Language20}>
			<HeaderPanelLinks>
				<h3 class="px-4 pb-4">{$t('generic.language', { count: '1' })}</h3>
				<HeaderPanelLink>
					<row class="justify-between items-center" on:click={() => ($locale = 'en')}>
						{$t('generic.english')}
					</row>
				</HeaderPanelLink>
				<HeaderPanelLink>
					<row class="justify-between items-center" on:click={() => ($locale = 'de')}>
						{$t('generic.german')}
					</row>
				</HeaderPanelLink>
			</HeaderPanelLinks>
		</HeaderAction>
		<HeaderAction icon={UserAvatar20}>
			<HeaderPanelLinks>
				<h3 class="px-4 pb-4">{'TODO'}</h3>
				<HeaderPanelLink>
					<!-- <row class="justify-between items-center" on:click={handleLogout}>
							{$t('login.sing-out')}
							<Logout20 class="h-4" />
						</row> -->
				</HeaderPanelLink>
			</HeaderPanelLinks>
		</HeaderAction>
	</HeaderUtilities>
</Header>

<!-- 
	The following is a workaround. 

	Binding `isOpen` is required. Thus, two options: 
		1. Render the SideNavs in this component. 
		2. Introduce a side nav store. 
	Option 1 has been chosen. 
-->
<!-- {#if $page.params.uri}
	<UriSideNav bind:isOpen={isSideNavOpen} />
{/if} -->

<Content>
	<slot />
</Content>
