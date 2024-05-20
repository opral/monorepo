import isoGit from "../../vendored/isomorphic-git/index.js"
import type { RepoContext, RepoState } from "../openRepository.js"
import { makeHttpClient } from "../git-http/client.js"

export const push = async (ctx: RepoContext, state: RepoState) => {
	if (!ctx.gitUrl) {
		throw new Error("Could not find repo url, only github supported for push at the moment")
	}
	return await isoGit.push({
		fs: ctx.rawFs,
		url: ctx.gitUrl,
		cache: ctx.cache,
		corsProxy: ctx.gitProxyUrl,
		http: makeHttpClient({ debug: ctx.debug, description: "push" }),
		dir: ctx.dir,
	})
}
