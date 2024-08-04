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
	let isInstalled = false

	const installResult = await githubClient.getInstallations()
	if (!("error" in installResult)) {
		const found = installResult.installations.find((i: any) => i.account.login === owner)

		if (found?.repository_selection === "all") {
			isInstalled = true
		} else if (found) {
			const repoResult = await githubClient.getAvailableRepos(found.id)

			if (
				!("error" in repoResult) &&
				repoResult.repositories.find((r: any) => r.full_name === `${owner}/${repoName}`)
			) {
				isInstalled = true
			}
		}
	}

	if ("error" in res) {
		return { error: res.error }
	} else {
		const ownerType: "user" | "organization" = res.data.owner.type.toLowerCase()

		let ownerRights = false //  ownerType === 'user' && res.data.owner.login === login

		return {
			allowForking: res.data.allow_forking,
			name: res.data.name,
			isPrivate: res.data.private,
			isFork: res.data.fork,
			isInstalled,
			permissions: {
				admin: res.data.permissions?.admin || false,
				push: res.data.permissions?.push || false,
				pull: res.data.permissions?.pull || false,
				owner: ownerRights,
			},
			owner: {
				type: ownerType,
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
