import isoGit from "../../vendored/isomorphic-git/index.js"
import type { RepoContext, RepoState } from "../openRepository.js"

export async function remove(ctx: RepoContext, state: RepoState, filepath: string) {
	await state.ensureFirstBatch()

	return await isoGit.remove({
		fs: ctx.rawFs,
		dir: ctx.dir,
		cache: ctx.cache,
		filepath,
	})
}
