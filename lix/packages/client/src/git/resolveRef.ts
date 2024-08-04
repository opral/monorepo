import type { RepoContext } from "../openRepository.js"
import isoGit from "../../vendored/isomorphic-git/index.js"

// FIXME: option to return intermediate ref results!
export async function resolveRef(ctx: RepoContext, { ref, depth }: { ref: string; depth: number }) {
	try {
		return await isoGit.resolveRef({ fs: ctx.rawFs, dir: ctx.dir, ref, depth })
	} catch (error) {
		return { error }
	}
}
