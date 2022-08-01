<script lang="ts">
	import git from 'isomorphic-git';
	import { fs } from '$lib/stores/filesystem';

	let hasChanges: () => Promise<boolean>;
	$: hasChanges = async () => {
		// referencing $fs to get reactivity (fs.callbackBased is not reactive)
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const _ = $fs;
		const statusMatrix = await git.statusMatrix({ fs: fs.callbackBased, dir: '/' });
		// status[2] = WorkdirStatus
		// WorkdirStatus === 2 = modified
		return statusMatrix.some((status) => status[2] === 2);
	};
</script>

{#await hasChanges()}
	<p>has changes: loading...</p>
{:then hasChanges}
	<p>has changes: {hasChanges}</p>
{/await}
