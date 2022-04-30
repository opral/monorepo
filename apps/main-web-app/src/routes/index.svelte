<script lang="ts">
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
</script>

<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
	{#each forks as fork}
		<sl-card class="space-y-1">
			<div class="flex justify-between items-center gap-2">
				<h2 class="title-md pt-1">{fork.name}</h2>
				<img
					class="h-7 w-7"
					src={fork.iconSrc}
					alt="A kitten sits patiently between a terracotta pot and decorative grasses."
				/>
			</div>
			<h2 class="label-md">
				<sl-icon name="star" />
				{fork.stars}
			</h2>
			<p class="body-md">{fork.description}</p>
			<sl-button size="small" class="pt-3 w-full">Open</sl-button>
		</sl-card>
	{/each}
</div>
