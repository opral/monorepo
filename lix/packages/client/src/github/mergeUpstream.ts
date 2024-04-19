import isoGit from "../../vendored/isomorphic-git/index.js"
import type { RepoContext } from "../repoContext.js"

export async function mergeUpstream(ctx: RepoContext, cmdArgs: { branch?: string } = {}) {
	if (!ctx.gitUrl) {
		throw new Error(
			"Could not find repo url, only github supported for mergeUpstream at the moment"
		)
	}
	const branch =
		cmdArgs?.branch ||
		(await isoGit.currentBranch({
			fs: ctx.rawFs,
			dir: ctx.dir,
			fullname: false,
		}))
	if (typeof branch !== "string") {
		throw "could not get current branch"
	}

	let response
	try {
		response = await ctx.githubClient.mergeUpstream({
			branch,
			owner: ctx.owner,
			repoName: ctx.repoName,
		})
	} catch (error) {
		return { error }
	}

	return response?.data || response.error
}
