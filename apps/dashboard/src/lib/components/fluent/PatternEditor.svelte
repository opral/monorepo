<script lang="ts">
	import { TextArea } from 'carbon-components-svelte';
	export let serializedPattern: string;
	export let serializedSourcePattern: string;
	// workaround to pass classes to a component
	export { classes as class };
	let classes = '';

    
</script>

<div class={classes}>
	<TextArea
		bind:value={serializedPattern}
		light
		rows={1}
		invalid={serializedPattern === ''}
		invalidText="Missing message for this language."
	/>
</div>
