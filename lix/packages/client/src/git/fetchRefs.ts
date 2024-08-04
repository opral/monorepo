import type { RepoContext } from "../openRepository.js"
import isoGit from "../../vendored/isomorphic-git/index.js"
import { makeHttpClient } from "../git-http/client.js"

export async function fetchRefs(
	ctx: RepoContext,
	{
		debug,
		prefix = "refs/heads",
		exclude = [],
	}: { debug?: boolean; prefix?: string; exclude?: string[] } = {}
) {
	if (!ctx.gitUrl) {
		throw new Error("Could not find repo url, only github supported for getBranches at the moment")
	}
	let serverRefs

	try {
		serverRefs = await isoGit.listServerRefs({
			url: ctx.gitUrl,
			corsProxy: ctx.gitProxyUrl,
			prefix,
			protocolVersion: 2,
			symrefs: true,
			http: makeHttpClient({
				debug: debug || ctx.debug,
				description: "getBranches",
				noCache: true,
			}),
		})
	} catch (_error) {
		return undefined
	}

	return serverRefs.filter((ref) => !ref.ref.startsWith("refs/heads/gh-readonly-queue/"))
}
