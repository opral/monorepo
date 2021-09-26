<script lang="ts">
	import UserAvatar32 from 'carbon-icons-svelte/lib/UserAvatar32';
	import User24 from 'carbon-icons-svelte/lib/User24';
	import Password24 from 'carbon-icons-svelte/lib/Password24';
	import Logout24 from 'carbon-icons-svelte/lib/Logout24';
	import {
		Header,
		HeaderGlobalAction,
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

	let isSideNavOpen = false;
</script>

<Header company="inlang" bind:isSideNavOpen>
	<div slot="skip-to-content">
		<SkipToContent />
	</div>

	<HeaderNav>
		<HeaderNavItem href="/projects" text="Projects" />
		<HeaderNavItem href="/organizations" text="Organizations" />
	</HeaderNav>
	<HeaderUtilities>
		<HeaderAction icon={User24}>
			<HeaderPanelLink href="/account">Account </HeaderPanelLink>
			<HeaderPanelLink href="/tokens">Access tokens</HeaderPanelLink>
			<HeaderPanelLink href="/signout">Log out</HeaderPanelLink>
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
