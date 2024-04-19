import isoGit from "../../vendored/isomorphic-git/index.js"
import type { RepoContext } from "../repoContext.js"

export async function add(ctx: RepoContext, filepath: string | string[]) {
	return await isoGit.add({
		fs: ctx.rawFs,
		parallel: true,
		dir: ctx.dir,
		cache: ctx.cache,
		filepath,
	})
}
