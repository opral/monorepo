<script lang="ts">
	import UserAvatar32 from 'carbon-icons-svelte/lib/UserAvatar32';
	import User24 from 'carbon-icons-svelte/lib/User24';
	import Password24 from 'carbon-icons-svelte/lib/Password24';
	import Logout24 from 'carbon-icons-svelte/lib/Logout24';
	import {
		Header,
		HeaderNav,
		HeaderNavItem,
		HeaderGlobalAction,
		OverflowMenu,
		OverflowMenuItem,
		SkipToContent,
		Content,
		Grid,
		Row,
		Column,
		HeaderUtilities
	} from 'carbon-components-svelte';

	let isSideNavOpen = false;
</script>

<Header company="inlang" platformName=" Svelte" bind:isSideNavOpen>
	<div slot="skip-to-content">
		<SkipToContent />
	</div>

	<HeaderNav>
		<HeaderNavItem href="/" text="Projects" />
		<HeaderNavItem href="/" text="Organizations" />
	</HeaderNav>
	<HeaderUtilities>
		<OverflowMenu icon={UserAvatar32} flipped class="w-48">
			<OverflowMenuItem>
				<div class="flex flex-row">
					<User24 class="mr-2 pr-1" />
					<p class="mr-1">Account</p>
				</div>
			</OverflowMenuItem>
			<OverflowMenuItem>
				<div class="flex flex-row">
					<Password24 class="mr-2 pr-1" />
					<p class="mr-1">Access tokens</p>
				</div>
			</OverflowMenuItem>
			<OverflowMenuItem>
				<div class="flex flex-row">
					<Logout24 class="mr-2 pr-1" />
					<p class="mr-1">Log out</p>
				</div>
			</OverflowMenuItem>
		</OverflowMenu>
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
