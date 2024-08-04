import type { RepoContext } from "../openRepository.js"
import isoGit from "../../vendored/isomorphic-git/index.js"
import { makeHttpClient } from "../git-http/client.js"

// TODO: deprecate this for local refs
export async function listBranches(ctx: RepoContext, { remote }: { remote?: string } = {}) {
	// if (!ctx.gitUrl) {
	// 	throw new Error("Could not find repo url, only github supported for getBranches at the moment")
	// }
	let refs

	try {
		refs = await isoGit.listBranches({
			fs: ctx.rawFs,
			remote,
			dir: ctx.dir,
			// url: ctx.gitUrl,
			// corsProxy: ctx.gitProxyUrl,
			// prefix: "refs/heads",
			// http: makeHttpClient({ debug: ctx.debug, noCache: true, description: "getBranches" }),
		})
	} catch (_error) {
		console.log("error getting branches", _error)
		return undefined
	}

	return refs
	// .filter((ref) => !ref.ref.startsWith("refs/heads/gh-readonly-queue/"))
	// .map((ref) => ref.ref.replace("refs/heads/", "")) || undefined
}
