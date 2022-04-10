import { Result } from '@inlang/result';
import git from 'isomorphic-git';

/**
 * Pushes to remote and pulls right after.
 */
export async function push(
	args: Parameters<typeof git['push']>[0] & Parameters<typeof git['pull']>[0]
): Promise<Result<void, Error>> {
	try {
		await git.push(args);
		await git.pull(args);
		return Result.ok(undefined);
	} catch (error) {
		return Result.err(error as Error);
	}
}
