import type { RepoContext, RepoState } from "../openRepository.js"
import isoGit from "../../vendored/isomorphic-git/index.js"

/**
 * Gets the git origin url of the current repository.
 *
 * @returns The git origin url or undefined if it could not be found.
 */
export async function listRemotes(ctx: RepoContext, state: RepoState) {
	try {
		const remotes = await isoGit.listRemotes({
			fs: state.nodeishFs,
			dir: ctx.dir,
		})

		return remotes
	} catch (_err) {
		return undefined
	}
}
