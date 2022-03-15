<script lang="ts">
	import Chat24 from 'carbon-icons-svelte/lib/Chat24';
	import Language24 from 'carbon-icons-svelte/lib/Language24';
	import Settings24 from 'carbon-icons-svelte/lib/Settings24';
	import DocumentExport24 from 'carbon-icons-svelte/lib/DocumentExport24';
	import DocumentImport24 from 'carbon-icons-svelte/lib/DocumentImport24';
	import Group24 from 'carbon-icons-svelte/lib/Group24';
	import { t } from '$lib/services/i18n';
	import {
		SideNavItems,
		SideNavLink,
		SideNav,
		Breadcrumb,
		BreadcrumbItem
	} from 'carbon-components-svelte';
	import { page } from '$app/stores';

	export let isOpen: boolean;

	$: path = $page.url.searchParams.get('path') ?? '';
</script>

<SideNav bind:isOpen expansionBreakpoint={320}>
	<SideNavItems>
		<Breadcrumb class="mx-4 mb-1">
			<BreadcrumbItem href="/uri/{$page.params.uri}" isCurrentPage={path === ''} class="font-bold">
				Repo
			</BreadcrumbItem>
			<!-- slice(1) = skip home path  -->
			{#each path.split('/').slice(1) as subpath, i}
				<!-- rootpath = the path(s) "above" the subpath  -->
				{@const rootpath = path.split('/').slice(1).slice(0, i).join('/')}
				<BreadcrumbItem href="/uri/{$page.params.uri}?path={rootpath}/{subpath}">
					{subpath}
				</BreadcrumbItem>
			{/each}
		</Breadcrumb>
		<SideNavLink icon={Chat24} text="Messages" href="/uri/{$page.params.uri}/messages" />
		<SideNavLink
			icon={Language24}
			text={$t('generic.language', { count: '2' })}
			href="/uri/{$page.params.uri}/languages"
		/>

		<SideNavLink icon={Settings24} text={'Config'} href="/uri/{$page.params.uri}/settings" />
	</SideNavItems>
</SideNav>
