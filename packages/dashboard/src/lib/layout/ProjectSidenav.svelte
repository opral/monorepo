<script lang="ts">
	import Home24 from 'carbon-icons-svelte/lib/Home24';
	import Key24 from 'carbon-icons-svelte/lib/Password24';
	import Language24 from 'carbon-icons-svelte/lib/Language24';
	import Edit24 from 'carbon-icons-svelte/lib/Edit24';
	import Import24 from 'carbon-icons-svelte/lib/DocumentImport24';
	import Export24 from 'carbon-icons-svelte/lib/DocumentExport24';
	import Activity24 from 'carbon-icons-svelte/lib/Activity24';
	import Members24 from 'carbon-icons-svelte/lib/Events24';
	import Integration24 from 'carbon-icons-svelte/lib/Integration24';
	import Settings24 from 'carbon-icons-svelte/lib/Settings24';
	import { SideNav, SideNavItems, SideNavLink } from 'carbon-components-svelte';

	export let projectName = 'testproject';
</script>

<SideNav isOpen={true} fixed class="w-48">
	<p class="pt-2 pl-14 h-8 bx--side-nav__link-text text-xl">{projectName}</p>
	<SideNavItems>
		<SideNavLink icon={Home24} text="Home" href="/" />
		<SideNavLink icon={Key24} text="Keys" href="/" />
		<SideNavLink icon={Language24} text="Languages" href="/" />
		<SideNavLink icon={Edit24} text="Editor" href="/" />
		<SideNavLink icon={Import24} text="Import" href="/" />
		<SideNavLink icon={Export24} text="Export" href="/" />
		<SideNavLink icon={Activity24} text="Activity" href="/" />
		<SideNavLink icon={Members24} text="Members" href="/" />
		<SideNavLink icon={Integration24} text="Integrations" href="/" />
		<SideNavLink icon={Settings24} text="Settings" href="/" />
	</SideNavItems>
</SideNav>
