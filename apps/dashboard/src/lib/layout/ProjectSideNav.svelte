<script lang="ts">
	import Chat24 from 'carbon-icons-svelte/lib/Chat24';
	import Language24 from 'carbon-icons-svelte/lib/Language24';
	import Settings24 from 'carbon-icons-svelte/lib/Settings24';
	import DocumentExport24 from 'carbon-icons-svelte/lib/DocumentExport24';
	import DocumentImport24 from 'carbon-icons-svelte/lib/DocumentImport24';
	import Group24 from 'carbon-icons-svelte/lib/Group24';
	import { t } from '$lib/services/i18n';
	import { SideNavItems, SideNavLink, SideNav } from 'carbon-components-svelte';
	import { page } from '$app/stores';

	export let isOpen: boolean;
</script>

<SideNav bind:isOpen expansionBreakpoint={320}>
	<SideNavItems>
		<SideNavLink icon={Chat24} text="Messages" href="/project/{$page.params.projectId}/messages" />
		<SideNavLink
			icon={Language24}
			text={$t('generic.language', { count: '2' })}
			href="/project/{$page.params.projectId}/languages"
		/>
		<SideNavLink
			icon={DocumentImport24}
			text={$t('generic.import')}
			href="/project/{$page.params.projectId}/import"
		/>
		<SideNavLink
			icon={DocumentExport24}
			text={$t('generic.export')}
			href="/project/{$page.params.projectId}/export"
		/>
		<SideNavLink
			icon={Group24}
			text={$t('generic.members')}
			href="/project/{$page.params.projectId}/members"
		/>
		<SideNavLink
			icon={Settings24}
			text={$t('generic.settings')}
			href="/project/{$page.params.projectId}/settings"
		/>
	</SideNavItems>
</SideNav>
