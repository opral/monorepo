<script>
	import CreateEntity from './CreateEntity.svelte';

	const pkg = {
		title: 'Organizations',
		description: 'Organizations help you to easily share and manage projects within your company.',
		name: 'organization'
	};
</script>

<CreateEntity title={pkg.title} description={pkg.description} name={pkg.name} />
