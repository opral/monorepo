<script lang="ts">
	import Key24 from 'carbon-icons-svelte/lib/Password24';
	import Language24 from 'carbon-icons-svelte/lib/Language24';
	import Settings24 from 'carbon-icons-svelte/lib/Settings24';
	import DocumentExport24 from 'carbon-icons-svelte/lib/DocumentExport24';
	import DocumentImport24 from 'carbon-icons-svelte/lib/DocumentImport24';
	import { SideNavItems, SideNavLink, SideNav } from 'carbon-components-svelte';
	import { page } from '$app/stores';

	export let isOpen: boolean;
</script>

<SideNav bind:isOpen expansionBreakpoint={320}>
	<SideNavItems>
		<SideNavLink icon={Key24} text="Keys" href="/project/{$page.params.projectId}/keys" />
		<SideNavLink
			icon={Language24}
			text="Languages"
			href="/project/{$page.params.projectId}/languages"
		/>
		<SideNavLink
			icon={DocumentImport24}
			text="Import"
			href="/project/{$page.params.projectId}/import"
		/>
		<SideNavLink
			icon={DocumentExport24}
			text="Export"
			href="/project/{$page.params.projectId}/export"
		/>
		<SideNavLink
			icon={Settings24}
			text="Settings"
			href="/project/{$page.params.projectId}/settings"
		/>
	</SideNavItems>
</SideNav>
