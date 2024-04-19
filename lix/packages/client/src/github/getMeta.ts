import { transformRemote } from "../helpers.js"
import type { RepoContext } from "../repoContext.js"
/**
 * Additional information about a repository provided by GitHub.
 */
export async function getMeta(ctx: RepoContext) {
	const { gitUrl, owner, repoName, githubClient } = ctx

	if (!gitUrl) {
		throw new Error("Could not find repo url, only github supported for getMeta at the moment")
	}

	const res = await githubClient.getRepo({ repoName, owner })

	if ("error" in res) {
		return { error: res.error }
	} else {
		return {
			name: res.data.name,
			isPrivate: res.data.private,
			isFork: res.data.fork,
			permissions: {
				admin: res.data.permissions?.admin || false,
				push: res.data.permissions?.push || false,
				pull: res.data.permissions?.pull || false,
			},
			owner: {
				name: res.data.owner.name || undefined,
				email: res.data.owner.email || undefined,
				login: res.data.owner.login,
			},
			parent: res.data.parent
				? {
						url: transformRemote(res.data.parent.git_url) || "unknown",
						fullName: res.data.parent.full_name,
				  }
				: undefined,
		}
	}
}
