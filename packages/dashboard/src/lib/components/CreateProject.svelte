<script>
	import CreateEntity from './CreateEntity.svelte';

	const pkg = {
		title: 'Your projects',
		description: '',
		name: 'project'
	};
</script>

<CreateEntity title={pkg.title} description={pkg.description} name={pkg.name} />
