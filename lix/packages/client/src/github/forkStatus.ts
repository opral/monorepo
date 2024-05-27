import isoGit from "../../vendored/isomorphic-git/index.js"
import { makeHttpClient } from "../git-http/client.js"
import type { RepoContext } from "../openRepository.js"
import { optimizeReq, optimizeRes } from "../git-http/optimizeReq.js"
import { getMeta } from "../github/getMeta.js"

export async function forkStatus(ctx: RepoContext) {
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

	const useBranchName = await isoGit.currentBranch({
		fs: ctx.rawFs,
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
		fs: ctx.rawFs,
	})

	try {
		await isoGit.fetch({
			depth: 1,
			singleBranch: true,
			dir,
			cache,
			ref: useBranchName,
			remote: "upstream",
			http: makeHttpClient({
				debug,
				description: "forkStatus",
				onReq: ctx.experimentalFeatures.lazyClone
					? optimizeReq.bind(null, {
							noBlobs: true,
							addRefs: [useBranchName || "HEAD"],
					  })
					: undefined,
				onRes: ctx.experimentalFeatures.lazyClone ? optimizeRes : undefined,
			}),
			tags: false,
			fs: ctx.rawFs,
		})
	} catch (err) {
		return { error: err }
	}

	const currentUpstreamCommit = await isoGit.resolveRef({
		fs: ctx.rawFs,
		dir: "/",
		ref: "upstream/" + useBranchName,
	})

	const currentOriginCommit = await isoGit.resolveRef({
		fs: ctx.rawFs,
		dir: "/",
		ref: useBranchName,
	})

	if (currentUpstreamCommit === currentOriginCommit) {
		return { ahead: 0, behind: 0, conflicts: undefined }
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
		depth: behind + 1,
		remote: "upstream",
		cache,
		singleBranch: true,
		dir,
		ref: useBranchName,
		http: makeHttpClient({ debug, description: "forkStatus" }),
		fs: ctx.rawFs,
	})

	// fetch from fors remote
	await isoGit.fetch({
		depth: ahead + 1,
		cache,
		singleBranch: true,
		ref: useBranchName,
		dir,
		http: makeHttpClient({ debug, description: "forkStatus" }),
		corsProxy: gitProxyUrl,
		fs: ctx.rawFs,
	})

	// finally try to merge the changes from upstream
	let conflicts: { data: string[]; code: string } | undefined
	try {
		await isoGit.merge({
			fs: ctx.rawFs,
			cache,
			author: { name: "lix" },
			dir,
			ours: useBranchName,
			dryRun: true,
			theirs: "upstream/" + useBranchName,
			noUpdateBranch: true,
			abortOnConflict: true,
		})
	} catch (err: any) {
		conflicts = {
			data: err.data,
			code: err.code,
		}
		console.warn(conflicts)
	}
	return { ahead, behind, conflicts }
}
