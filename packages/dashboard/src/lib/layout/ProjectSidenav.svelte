<script lang="ts">
	import Home24 from 'carbon-icons-svelte/lib/Home24';
	import Key24 from 'carbon-icons-svelte/lib/Password24';
	import Language24 from 'carbon-icons-svelte/lib/Language24';
	import Settings24 from 'carbon-icons-svelte/lib/Settings24';
	import { SideNav, SideNavItems, SideNavLink } from 'carbon-components-svelte';
	import { page } from '$app/stores';
</script>

<!-- 
	SideNav is not suppoes to be used as static element. 
	Therefore, the margins have to be adjusted to escape the `Content` 
	component from the outter layout. That is achieved by setting negative margins.

	Should be changed long term. 
-->
<SideNav isOpen={true} fixed class="w-64 static p-4 -ml-12 -mt-8">
	<SideNavItems>
		<SideNavLink icon={Home24} text="Home" href="/project/{$page.params.projectId}" />
		<SideNavLink icon={Key24} text="Keys" href="/project/{$page.params.projectId}/keys" />
		<SideNavLink
			icon={Language24}
			text="Languages"
			href="/project/{$page.params.projectId}/languages"
		/>
		<!-- <SideNavLink icon={Import24} text="Import" href="/project/{$page.params.projectId}/import" /> -->
		<!-- <SideNavLink icon={Export24} text="Export" href="/project/{$page.params.projectId}/export" /> -->
		<!-- 	<SideNavLink icon={Activity24} text="Activity" href="/" /> -->
		<!-- <SideNavLink icon={Members24} text="Members" href="/project/{$page.params.projectId}/members" /> -->
		<!-- 		<SideNavLink icon={Integration24} text="Integrations" href="/" />
 -->
		<SideNavLink
			icon={Settings24}
			text="Settings"
			href="/project/{$page.params.projectId}/settings"
		/>
	</SideNavItems>
</SideNav>
