import git from 'isomorphic-git';

/**
 * Files that have changes.
 *
 * Returns a list of paths to those files.
 */
export async function filesWithChanges(
	args: Parameters<typeof git['statusMatrix']>[0]
): Promise<string[]> {
	const statusMatrix = await git.statusMatrix(args);
	// status[2] = WorkdirStatus
	// WorkdirStatus === 2 = modified
	const changedFiles = statusMatrix.filter((status) => status[2] === 2);
	// only return the path
	return changedFiles.map((file) => file[0]);
}
