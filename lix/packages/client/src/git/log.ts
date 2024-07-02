import isoGit from "../../vendored/isomorphic-git/index.js"
import type { RepoContext } from "../openRepository.js"

// TODO: handle shallows = [ 'sadf', 'sdf' ]

export async function log(
	ctx: RepoContext,
	cmdArgs: {
		depth: number
		filepath?: string
		ref?: string
		since?: Date
		force?: boolean
		follow?: boolean
	}
) {
	return await isoGit.log({
		fs: ctx.rawFs,
		depth: cmdArgs?.depth,
		filepath: cmdArgs?.filepath,
		dir: ctx.dir,
		ref: cmdArgs?.ref,
		cache: ctx.cache,
		since: cmdArgs?.since,
		force: cmdArgs?.force,
		follow: cmdArgs?.follow,
	})
}
