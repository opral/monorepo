import type { RepoContext } from "../openRepository.js"
import isoGit from "../../vendored/isomorphic-git/index.js"

export async function coreRefs(ctx: RepoContext) {
	// { addRefs }: { addRefs: string[] } = {
	try {
		const refs = await Promise.all([
			isoGit.resolveRef({ fs: ctx.rawFs, dir: ctx.dir, ref: "HEAD", depth: 2 }),
			isoGit.resolveRef({ fs: ctx.rawFs, dir: ctx.dir, ref: "HEAD", depth: 3 }),

			isoGit.resolveRef({ fs: ctx.rawFs, dir: ctx.dir, ref: "refs/remotes/origin/HEAD", depth: 2 }),
			isoGit.resolveRef({ fs: ctx.rawFs, dir: ctx.dir, ref: "refs/remotes/origin/HEAD", depth: 3 }),
		])

		const coreRefs = {
			head: {
				oid: refs[1],
				ref: refs[0],
			},

			// currentBase: { // todo handle no head ref, local base ref different from main base
			// 	oid: refs[5],
			// 	ref: refs[4]
			// }, // || {}

			mainBase: {
				oid: refs[3],
				ref: refs[2],
			},
		}

		return coreRefs
	} catch (error) {
		return { error }
	}
}
