import type { RepoState, RepoContext } from "../openRepository.js"
import isoGit from "../../vendored/isomorphic-git/index.js"

export async function getCurrentBranch(ctx: RepoContext, state: RepoState) {
	// TODO: maybe make stateless, deprecate move to currentRef, baseBranch etc. to support branchless work modes
	return (
		(await isoGit.currentBranch({
			fs: state.nodeishFs,
			dir: ctx.dir,
		})) || undefined
	)
}
