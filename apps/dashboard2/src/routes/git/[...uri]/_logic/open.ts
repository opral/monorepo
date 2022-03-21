import { Result } from '@inlang/utils';
import git from 'isomorphic-git';

/**
 * Clones a repository and checks out or creates the 'inlang' branch.
 *
 * All commits should happen on the 'inlang' branch. Thus, automatic checkout to that branch.
 */
export async function open(args: Parameters<typeof git['clone']>[0]): Promise<Result<void, Error>> {
	try {
		await git.clone(args);
		(await checkoutOrCreateInlangBranch({ ref: 'inlang', ...args })).unwrap();
		return Result.ok(undefined);
	} catch (error) {
		return Result.err(error as Error);
	}
}

/**
 * Checkout or create the 'inlang' branch.
 */
async function checkoutOrCreateInlangBranch(
	args: Parameters<typeof git['checkout']>[0] & Parameters<typeof git['branch']>[0]
): Promise<Result<void, Error>> {
	try {
		const branches = await git.listBranches(args);
		if (branches.includes('inlang')) {
			await git.checkout(args);
		} else {
			// create the branch
			await git.branch(args);
		}
		return Result.ok(undefined);
	} catch (error) {
		return Result.err(error as Error);
	}
}
