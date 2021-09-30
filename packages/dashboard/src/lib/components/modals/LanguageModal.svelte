<script lang="ts">
	import type { definitions } from '@inlang/database';
	import { Modal, Form, FormGroup, TextInput, Checkbox } from 'carbon-components-svelte';

	export let open = false;
	export let primaryButtonDisabled = false;

	export let heading: 'Add language' | 'Edit language';

	/**
	 *
	 * Set the language iso to "" for an empty code.
	 */
	export let languageIso: definitions['language']['iso_code'] | '';

	// export let countryCode
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
			<TextInput labelText="language code (ISO 639-1)" bind:value={languageIso} />
		</FormGroup>
		<FormGroup disabled>
			<TextInput labelText="country code (ISO 3166-1 alpha-2)" placeholder="coming soon..." />
		</FormGroup>
		<Checkbox labelText="Default language of project" />
	</Form>
</Modal>
