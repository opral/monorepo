import { Result } from '@inlang/result';
import git from 'isomorphic-git';
import { filesWithChanges } from './filesWithChanges';

/**
 * Adds (stages) all changed, commits the changes and pushes to remote.
 *
 * Happens all in one ago to accommdate the workflow. Non-technical users
 * don't know what a commit, push or remote is. Just show a "submit" button
 * which performs staging, committing and pushing in one go.
 */
export async function commitAndPush(
	args: Parameters<typeof git['commit']>[0] &
		Parameters<typeof filesWithChanges>[0] &
		Parameters<typeof git['push']>[0]
): Promise<Result<void, Error>> {
	try {
		const paths = await filesWithChanges(args);
		for (const path of paths) {
			await git.add({ filepath: path, ...args });
		}
		await git.commit(args);
		await git.push(args);
		return Result.ok(undefined);
	} catch (error) {
		return Result.err(error as Error);
	}
}
