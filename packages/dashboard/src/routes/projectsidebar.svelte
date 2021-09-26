<script lang="ts">
    import Home24 from 'carbon-icons-svelte/lib/Home24'
    import Key24 from 'carbon-icons-svelte/lib/Password24';
    import Language24 from 'carbon-icons-svelte/lib/Language24';
    import Edit24 from 'carbon-icons-svelte/lib/Edit24';
    import Import24 from 'carbon-icons-svelte/lib/DocumentImport24';
    import Export24 from 'carbon-icons-svelte/lib/DocumentExport24';
    import Activity24 from 'carbon-icons-svelte/lib/Activity24';
    import Members24 from 'carbon-icons-svelte/lib/Events24';
    import Integration24 from 'carbon-icons-svelte/lib/Integration24';
    import Settings24 from 'carbon-icons-svelte/lib/Settings24';


    import Navbar from './navbar.svelte'
	import {
		SideNav,
        SideNavItems,
        SideNavLink
	} from 'carbon-components-svelte';

</script>
<Navbar></Navbar>
<SideNav isOpen={true} rail>
    <SideNavItems>
       <SideNavLink icon={Home24} text = Home href ="/"> </SideNavLink>
        <SideNavLink icon={Key24} text = Keys href ="/"> </SideNavLink>
        <SideNavLink icon={Language24} text = Languages href ="/"> </SideNavLink>
        <SideNavLink icon={Edit24} text = Editor href ="/"> </SideNavLink>
        <SideNavLink icon={Import24} text = Import href ="/"></SideNavLink>
        <SideNavLink icon={Export24} text = Export href ="/"></SideNavLink>
       <SideNavLink icon={Activity24} text = Activity href ="/"> </SideNavLink>
       <SideNavLink icon={Members24} text = Members href ="/"></SideNavLink>
        <SideNavLink icon={Integration24} text = Integrations href ="/"> </SideNavLink>
      <SideNavLink icon={Settings24} text = Settings href ="/"></SideNavLink>
    </SideNavItems>
</SideNav>
