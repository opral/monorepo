<script lang="ts">
	import type { SlDialog } from '@shoelace-style/shoelace';

	/** The demonstration repository */
	const repositories = [
		{
			name: 'inlang/demo',
			iconSrc: 'https://github.com/inlang.png',
			description: 'Try out the inlang editor with the demo repository.',
			stars: 0,
			href: '/git/https://github.com/inlang/demo/in-editor'
		}
	];

	let searchValue = '';

	let addProjectDialog: SlDialog;
</script>

<!-- START SEARCHBAR -->
<div class="flex gap-2">
	<sl-input
		placeholder="Search projects"
		size="medium"
		class="w-full"
		on:input={(event) => (searchValue = event.srcElement.value)}
	>
		<sl-icon name="search" slot="prefix" />
	</sl-input>
	<sl-button
		class="hidden sm:block"
		on:click={() => {
			addProjectDialog.show();
		}}
	>
		<sl-icon name="plus-circle" slot="prefix" />
		Add project
	</sl-button>
</div>
<!-- END SEARCHBAR -->

<!-- START REPOSITORY GRID -->
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
	{#each repositories.filter((repository) => repository.name.includes(searchValue)) as repository}
		{@const isDemo = repository.name.includes('demo')}
		<sl-card class="space-y-1" class:demo-card={isDemo}>
			<div class="flex justify-between items-center gap-2">
				<h2 class="title-md pt-1">{repository.name}</h2>
				<img class="h-7 w-7" src={repository.iconSrc} alt="{repository.name} icon" />
			</div>
			<h2 class="label-md">
				<sl-icon name="star" />
				{repository.stars}
			</h2>
			<p class="body-md">{repository.description}</p>
			<sl-button
				size="small"
				variant={isDemo ? 'primary' : ''}
				class="pt-3 w-full"
				href={repository.href}>Open</sl-button
			>
		</sl-card>
	{/each}
</div>
<!-- END REPOSITORY GRID -->

<!-- START Add project dialog -->
<sl-dialog bind:this={addProjectDialog}>
	<h1 slot="label">Add project</h1>
	<p class="body-md">The feature is not implemented yet.</p>
</sl-dialog>

<!-- End Add project dialog -->
<style lang="postcss">
	.demo-card::part(base) {
		@apply bg-primary-container border-primary text-on-primary-container;
	}
</style>
