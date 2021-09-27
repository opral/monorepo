<script lang="ts">
	import UserAvatar32 from 'carbon-icons-svelte/lib/UserAvatar32';
	import User24 from 'carbon-icons-svelte/lib/User24';
	import Password24 from 'carbon-icons-svelte/lib/Password24';
	import Logout24 from 'carbon-icons-svelte/lib/Logout24';
	import {
		Header,
		HeaderNav,
		HeaderNavItem,
		HeaderAction,
		HeaderPanelLink,
		SkipToContent,
		Content,
		Grid,
		Row,
		Column,
		HeaderUtilities
	} from 'carbon-components-svelte';
  // export let avatar:
  export let username:string; 
	let isSideNavOpen = false;
</script>

<Header company="inlang" bind:isSideNavOpen>
	<div slot="skip-to-content">
		<SkipToContent />
	</div>

	<HeaderNav>
		<HeaderNavItem href="/" text="Projects" />
		<HeaderNavItem href="/" text="Organizations" />
	</HeaderNav>
	<HeaderUtilities>
		<HeaderAction icon={User24} text={username}>
			<HeaderPanelLink href="/"> Account </HeaderPanelLink>
			<HeaderPanelLink href="/"> Access tokens</HeaderPanelLink>
			<HeaderPanelLink href="/">Log out</HeaderPanelLink>
		</HeaderAction>
</HeaderUtilities> 
</Header>

<Content>
	<Grid>
		<Row>
			<Column>
				<h1>Welcome</h1>
			</Column>
		</Row>
	</Grid>
</Content>
