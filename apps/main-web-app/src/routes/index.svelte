<script lang="ts">
	import type { SlDialog } from '@shoelace-style/shoelace';

	/** inlang forks of public github projects */
	const forks = [
		{
			name: 'inlang/inlang',
			iconSrc: 'https://github.com/inlang.png',
			description: 'Open Source Localization Solution for Software.',
			stars: 0,
			url: ''
		}
	];

	/** The demonstration repository */
	const demoRepository = {
		name: 'Try it yourself',
		iconSrc: 'https://github.com/inlang.png',
		description: 'Try out the inlang editor in a demo repository.',
		stars: 0,
		url: ''
	};

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
	<!-- START DEMO REPOSITORY -->
	{#if searchValue === ''}
		<sl-card class="space-y-1 demo-card">
			<div class="flex justify-between items-center gap-2">
				<h2 class="title-md pt-1">{demoRepository.name}</h2>
				<img class="h-7 w-7" src={demoRepository.iconSrc} alt="{demoRepository.name} icon" />
			</div>
			<h2 class="label-md">
				<sl-icon name="star" />
				{demoRepository.stars}
			</h2>
			<p class="body-md">{demoRepository.description}</p>
			<sl-button size="small" variant="primary" class="pt-3 w-full">Open</sl-button>
		</sl-card>
	{/if}
	<!-- END DEMO REPOSITORY -->

	<!-- START FORKED REPOSITORIES -->
	<!-- remove slice when fetching forked repositories is implemented  -->
	{#each forks.filter((fork) => fork.name.includes(searchValue)).slice(1) as fork}
		<sl-card class="space-y-1">
			<div class="flex justify-between items-center gap-2">
				<h2 class="title-md pt-1">{fork.name}</h2>
				<img class="h-7 w-7" src={fork.iconSrc} alt="{fork.name} icon" />
			</div>
			<h2 class="label-md">
				<sl-icon name="star" />
				{fork.stars}
			</h2>
			<p class="body-md">{fork.description}</p>
			<sl-button size="small" class="pt-3 w-full">Open</sl-button>
		</sl-card>
	{/each}
	<!-- END FORKED REPOSITORIES -->
</div>
<!-- END REPOSITORY GRID -->

<!-- START Add project dialog -->
<sl-dialog bind:this={addProjectDialog}>
	<h1 slot="label">Add project</h1>
	<p class="body-md">
		The feature is not implemented yet. Do you want to be notified when the feature is implemented?
	</p>
	<iframe
		class="pt-4"
		src="https://tally.so/embed/mZj5av?alignLeft=1&hideTitle=1&transparentBackground=1"
		width="100%"
		height="150"
		frameborder="0"
		marginheight="0"
		marginwidth="0"
		title="Inlang newsletter"
	/>
</sl-dialog>

<!-- End Add project dialog -->
<style lang="postcss">
	.demo-card::part(base) {
		@apply bg-primary-container border-primary text-on-primary-container;
	}
</style>
