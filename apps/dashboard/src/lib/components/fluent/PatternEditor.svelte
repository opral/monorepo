<script lang="ts">
	import { parsePattern } from '@inlang/fluent-ast';
	import { lintPattern } from '@inlang/fluent-lint';
	import { TextArea } from 'carbon-components-svelte';
	import { t } from '$lib/services/i18n';

	/**
	 * Is used to lint the pattern.
	 *
	 * If the pattern is the source pattern itself, pass
	 * `null`.
	 */
	// `null` instead of `undefined` to explicitly force consuming component to define the value
	export let serializedSourcePattern: string | null;
	export let serializedPattern: string;

	/**
	 * If true, the component skips checking whether the pattern is correct or not.
	 *
	 * An empty pattern is not an error for a message which has attributes.
	 */
	export let emptyPatternIsOk = false;
	// workaround to pass classes to a component
	export { classes as class };

	let classes = '';

	$: numRows = (serializedPattern ?? '').split(/\r\n|\r|\n/).length;

	let isValid: () => { value: boolean; message?: string };
	$: isValid = () => {
		if (serializedPattern === '' || serializedPattern === undefined) {
			if (emptyPatternIsOk) {
				return { value: true };
			} else {
				return { value: false, message: $t('error.missing-pattern') };
			}
		}
		// need to parse the patterns in order to lint.
		// not relying on externally parsed patterns because
		// the pattern is modified in this component. Externally
		// passed patterns would reflect the changes in this component.
		const parsed = parsePattern(serializedPattern ?? '');
		if (parsed.isErr) {
			return { value: false, message: parsed.error.message };
		} else if (serializedSourcePattern) {
			const parsedSource = parsePattern(serializedSourcePattern);
			if (parsedSource.isErr) {
				return {
					value: false,
					message: $t('error.unparsable')
				};
			}
			const lint = lintPattern({ source: parsedSource.value, target: parsed.value });
			if (lint.isErr) {
				return { value: false, message: lint.error.message };
			}
		}
		return { value: true };
	};
</script>

<div class={classes}>
	<TextArea
		bind:value={serializedPattern}
		light
		rows={numRows < 2 ? 2 : numRows}
		invalid={isValid().value === false}
		invalidText={isValid().message}
	/>
</div>
