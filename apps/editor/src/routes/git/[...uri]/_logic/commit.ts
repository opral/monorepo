import { Result } from '@inlang/result';
import git from 'isomorphic-git';

/**
 * Adds (stages) all changed and commits the changes.
 *
 * Happens all in one ago to accommdate the workflow. Non-technical users
 * don't know what a commit, push or remote is.
 */
export async function commit(
	args: Parameters<typeof git['commit']>[0] & Parameters<typeof filesWithChanges>[0]
): Promise<Result<void, Error>> {
	try {
		const paths = await filesWithChanges(args);
		for (const path of paths) {
			await git.add({ filepath: path, ...args });
		}
		await git.commit(args);
		return Result.ok(undefined);
	} catch (error) {
		return Result.err(error as Error);
	}
}

/**
 * Files that have changes.
 *
 * Returns a list of paths to those files.
 */
async function filesWithChanges(
	args: Parameters<typeof git['statusMatrix']>[0]
): Promise<string[]> {
	const statusMatrix = await git.statusMatrix(args);
	// status[2] = WorkdirStatus
	// WorkdirStatus === 2 = modified
	const changedFiles = statusMatrix.filter((status) => status[2] === 2);
	// only return the path
	return changedFiles.map((file) => file[0]);
}
