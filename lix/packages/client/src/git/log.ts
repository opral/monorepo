import isoGit from "../../vendored/isomorphic-git/index.js"
import type { RepoContext } from "../openRepository.js"

export async function log(
	ctx: RepoContext,
	cmdArgs: { depth: number; filepath?: string; ref?: string; since?: Date }
) {
	return await isoGit.log({
		fs: ctx.rawFs,
		depth: cmdArgs?.depth,
		filepath: cmdArgs?.filepath,
		dir: ctx.dir,
		ref: cmdArgs?.ref,
		cache: ctx.cache,
		since: cmdArgs?.since,
	})
}
