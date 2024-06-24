import isoGit from "../../vendored/isomorphic-git/index.js"
import { makeHttpClient } from "../git-http/client.js"
import { optimizeReq, optimizeRes } from "../git-http/optimizeReq.js"
import type { RepoContext, RepoState } from "../openRepository.js"

export async function fetch(
	ctx: RepoContext,
	state: RepoState,
	cmdArgs?: {
		debug?: boolean
		ref?: string
		remoteRef?: string
		depth?: number
		noCache?: boolean
		noBlobs?: boolean
		noTrees?: boolean
		relative?: true
		singleBranch?: boolean
	}
) {
	const noTrees = typeof cmdArgs?.noTrees === "undefined" ? false : cmdArgs?.noTrees
	const noBlobs = typeof cmdArgs?.noBlobs === "undefined" ? !noTrees : cmdArgs?.noBlobs

	const ref =
		cmdArgs?.ref || state.ref || (await isoGit.currentBranch({ fs: ctx.rawFs, dir: "/" })) || "HEAD"

	if (cmdArgs?.remoteRef && cmdArgs?.ref) {
		// distinguish in params if prefix or not so we can add wildcaards here
		// ['+refs/heads/*:refs/remotes/origin/*', '+refs/notes/commits:refs/notes/commits']
		const configValues = await isoGit.getConfigAll({
			fs: ctx.rawFs,
			dir: ctx.dir,
			path: "remote.origin.fetch",
		})
		const value = `+${cmdArgs.remoteRef}:${cmdArgs?.ref}` // this needs the /* format, removing this later for other isogit commands

		if (!configValues.includes(value)) {
			await isoGit.setConfig({
				fs: ctx.rawFs,
				dir: ctx.dir,
				path: "remote.origin.fetch",
				value, // "refs/notes/commits:refs/notes/commits", refs/notes/*
				append: true,
			})
		}
	}

	let since
	if (typeof cmdArgs?.depth === "undefined") {
		const oid = await isoGit.resolveRef({
			fs: ctx.rawFs,
			dir: ctx.dir,
			ref: "refs/remotes/origin/" + ref, // FIXME: generic ref support
		})
		const { commit } = await isoGit.readCommit({ fs: ctx.rawFs, dir: "/", oid })
		since = new Date(commit.committer.timestamp * 1000)
	}

	// TODO: deepen-not <rev>

	// TODO: exclude branch prefixes! eg. gh-readonly-queue
	// FIXME: isogit fetch does not suport prefixes and hard coded filters out non refs/heads refs, needs forking fetch
	const res = await isoGit.fetch({
		since,
		fs: ctx.rawFs,
		cache: ctx.cache,
		http: makeHttpClient({
			noCache: cmdArgs?.noCache,
			debug: cmdArgs?.debug || ctx.debug,
			description: "fetch",
			onReq: ctx.experimentalFeatures.lazyClone
				? optimizeReq.bind(null, {
						noTrees,
						noBlobs,
						addRefs: [
							cmdArgs?.remoteRef ? cmdArgs?.remoteRef.replace("*", "") : ref.replace("*", ""),
						],
				  })
				: undefined,
			onRes: ctx.experimentalFeatures.lazyClone ? optimizeRes : undefined,
		}),
		corsProxy: ctx.gitProxyUrl,
		ref: ref.replace("*", ""),
		tags: false,
		dir: ctx.dir,
		url: ctx.gitUrl,

		// remoteRef: cmdArgs?.remoteRef ? cmdArgs?.remoteRef.replace("*", "") : undefined,
		depth: cmdArgs?.depth,
		relative: cmdArgs?.relative, // Changes the meaning of depth to be measured from the current shallow depth rather than from the branch tip.

		singleBranch: typeof cmdArgs?.singleBranch === "undefined" ? true : cmdArgs?.singleBranch,

		// prune
		// pruneTags
		// remote: "origin",
	})

	// console.log({ res })
	// defaultBranch : "refs/heads/main"
	// fetchHead "f075dad41a58ed0c5590d11e3657c3cc11ef0a3e"
	// fetchHeadDescription   "branch 'main' of http://gitea.localhost/jan/cal.com"

	return res
}

// noTree, noBlob, depth: 1, ref: HEAD, ref: /refs/head/*, ref: refs:/pull/*, ref: refs:/tags/*, since: -2 months
