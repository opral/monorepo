import isoGit from "../../vendored/isomorphic-git/index.js"
import type { RepoContext, RepoState } from "../openRepository.js"

export async function readNote(
	ctx: RepoContext,
	state: RepoState,
	cmdArgs: {
		oid: string
		ref?: string
	}
) {
	const res = await isoGit.readNote({
		oid: cmdArgs.oid,
		fs: state.nodeishFs,
		cache: ctx.cache,
		ref: cmdArgs.ref, // The notes ref to look under
		dir: ctx.dir,
	})

	return res
}
