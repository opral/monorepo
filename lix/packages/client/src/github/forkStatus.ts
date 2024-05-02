import isoGit from "../../vendored/isomorphic-git/index.js"
import { makeHttpClient } from "../git-http/client.js"
import type { RepoContext, RepoState } from "../openRepository.js"
import { getMeta } from "../github/getMeta.js"

export async function forkStatus(ctx: RepoContext, state: RepoState) {
	const { gitUrl, debug, dir, cache, owner, repoName, githubClient, gitProxyUrl } = ctx

	if (!gitUrl) {
		throw new Error("Could not find repo url, only github supported for forkStatus at the moment")
	}

	const { isFork, parent, error } = (await getMeta(ctx)) as {
		error: any
		isFork: boolean
		parent: { url: string }
	}

	if (error) {
		return { error: "could check fork status of repo" }
	}

	if (!isFork) {
		return { error: "repo is not a fork" }
	}

	const forkFs = state.nodeishFs

	const useBranchName = await isoGit.currentBranch({
		fs: forkFs,
		dir,
		fullname: false,
	})

	if (!useBranchName) {
		return { error: "could not get fork status for detached head" }
	}

	await isoGit.addRemote({
		dir,
		remote: "upstream",
		url: "https://" + parent.url,
		fs: forkFs,
	})

	try {
		await isoGit.fetch({
			depth: 1,
			singleBranch: true,
			dir,
			cache,
			ref: useBranchName,
			remote: "upstream",
			http: makeHttpClient({ debug, description: "forkStatus" }),
			fs: forkFs,
		})
	} catch (err) {
		return { error: err }
	}

	const currentUpstreamCommit = await isoGit.resolveRef({
		fs: forkFs,
		dir: "/",
		ref: "upstream/" + useBranchName,
	})

	const currentOriginCommit = await isoGit.resolveRef({
		fs: forkFs,
		dir: "/",
		ref: useBranchName,
	})

	if (currentUpstreamCommit === currentOriginCommit) {
		return { ahead: 0, behind: 0, conflicts: false }
	}

	const compare = await githubClient
		.compare({
			owner,
			repoName,
			base: currentUpstreamCommit,
			head: currentOriginCommit,
		})
		.catch((newError: Error) => {
			return { error: newError }
		})

	if ("error" in compare || !("data" in compare)) {
		return { error: compare.error || "could not diff repos on github" }
	}

	const ahead: number = compare.data.ahead_by
	const behind: number = compare.data.behind_by

	// fetch from forks upstream
	await isoGit.fetch({
		depth: compare.data.behind_by + 1,
		remote: "upstream",
		cache: cache,
		singleBranch: true,
		dir,
		ref: useBranchName,
		http: makeHttpClient({ debug, description: "forkStatus" }),
		fs: forkFs,
	})

	// fetch from fors remote
	await isoGit.fetch({
		depth: compare.data.ahead_by + 1,
		cache: cache,
		singleBranch: true,
		ref: useBranchName,
		dir,
		http: makeHttpClient({ debug, description: "forkStatus" }),
		corsProxy: gitProxyUrl,
		fs: forkFs,
	})

	// finally try to merge the changes from upstream
	let conflicts = false
	try {
		await isoGit.merge({
			fs: forkFs,
			cache,
			author: { name: "lix" },
			dir,
			ours: useBranchName,
			dryRun: true,
			theirs: "upstream/" + useBranchName,
			noUpdateBranch: true,
			abortOnConflict: true,
		})
	} catch (err) {
		conflicts = true
	}
	return { ahead, behind, conflicts }
}
