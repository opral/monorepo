import isoGit from "../../vendored/isomorphic-git/index.js"
import type { RepoContext } from "../openRepository.js"

export async function readBlob(
	ctx: RepoContext,
	cmdArgs: {
		oid: string;
		filepath?: string;
	}
) {
	return await isoGit.readBlob({
		fs: ctx.rawFs,
		dir: ctx.dir,
		oid: cmdArgs?.oid,
		filepath: cmdArgs?.filepath,
		cache: ctx.cache,
	})
}
