<script lang="ts">
	import { Modal, Form, FormGroup, TextInput, Checkbox } from 'carbon-components-svelte';

	export let open = false;
	export let primaryButtonDisabled = false;

	export let heading = 'Add organization';

	export let organizationName: string | '' = '';
</script>

<Modal
	bind:open
	modalHeading={heading}
	primaryButtonText="Confirm"
	hasForm={true}
	bind:primaryButtonDisabled
	secondaryButtonText="Cancel"
	on:click:button--secondary={() => (open = false)}
	on:open
	on:close
	on:submit
>
	<Form>
		<FormGroup>
			<TextInput labelText="Organization name" bind:value={organizationName} />
		</FormGroup>
		<FormGroup disabled>
			<TextInput labelText="some other information" />
		</FormGroup>
		<Checkbox labelText="checkbox" />
	</Form>
</Modal>
