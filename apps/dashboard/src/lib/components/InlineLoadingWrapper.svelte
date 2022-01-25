<!-- 
    Adds the following to the InlineLoading component:
      - report bug button on error
      - handles if else statements internally
      - smooth transistion between active to x state
	  - switches to inactive automatically
 -->
<script lang="ts">
	import { brombTriggerLink } from '$lib/services/bromb';

	import { InlineLoading, Link } from 'carbon-components-svelte';

	/**
	 * Consuming component must bind the status.
	 *
	 * Internally the status is automoatically reset to inactive
	 * X seconds after being finished.
	 */
	export let status: 'active' | 'finished' | 'error' | 'inactive';
	export let activeDescription: string;
	export let finishedDescription: string;
	// usually if statement determines if element is shown
	export let inactiveDescription: string | undefined = undefined;
	export let errorDescription = 'An error occurred.';
	// workaround to pass classes to a component
	export { classes as class };

	let classes = '';

	// if the inline loading just became active (spinning),
	// start a timer, ensuring that the spinner is at least
	// spinning for X ms for better UX.
	$: if (status === 'active') {
		setTimeout(() => {
			if (status !== 'active') {
				console.warn(
					`@DEV: For better UX the active state should be preserved for at least 300 ms.`
				);
			}
		}, 300);
	}

	$: if (status === 'finished') {
		setTimeout(() => {
			status = 'inactive';
		}, 3000);
	}
</script>

<div class={classes}>
	{#if status === 'inactive'}
		<InlineLoading status="inactive" description={inactiveDescription} />
	{:else if status === 'active'}
		<InlineLoading status="active" description={activeDescription} />
	{:else if status === 'finished'}
		<InlineLoading status="finished" description={finishedDescription} />
	{:else if status === 'error'}
		<row class="items-center space-x-1">
			<InlineLoading status="error" description={errorDescription} class="w-auto" />
			<Link href={brombTriggerLink({ category: 'bug' })} class="text-xs">Report as bug</Link>
		</row>
	{/if}
</div>
