import type { RepoContext } from "../openRepository.js"
import isoGit from "../../vendored/isomorphic-git/index.js"

// TODO: deprecatre this for local refs
export async function getCurrentBranch(ctx: RepoContext) {
	// TODO: maybe make stateless, deprecate move to currentRef, baseBranch etc. to support branchless work modes
	return (
		(await isoGit.currentBranch({
			fs: ctx.rawFs,
			dir: ctx.dir,
		})) || undefined
	)
}
