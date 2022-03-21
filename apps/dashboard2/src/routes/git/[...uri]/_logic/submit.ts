import { Result } from '@inlang/utils';
import git from 'isomorphic-git';

/**
 * TODO
 */
export async function submit(
	args: Parameters<typeof git['push']>[0]
): Promise<Result<void, Error>> {
	try {
		await git.push(args);
		return Result.ok(undefined);
	} catch (error) {
		return Result.err(error as Error);
	}
}
