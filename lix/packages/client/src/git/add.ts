import isoGit from "../../vendored/isomorphic-git/index.js"
import type { RepoContext, RepoState } from "../openRepository.js"

export async function add(ctx: RepoContext, state: RepoState, filepath: string | string[]) {
	await state.ensureFirstBatch()

	return await isoGit.add({
		fs: ctx.rawFs,
		parallel: true,
		dir: ctx.dir,
		cache: ctx.cache,
		filepath,
	})
}
