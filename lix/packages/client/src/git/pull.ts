import isoGit from "../../vendored/isomorphic-git/index.js"
import type { RepoContext, RepoState, Author } from "../openRepository.js"
import { makeHttpClient } from "../git-http/client.js"
import { _checkout } from "./checkout.js"
import { emptyWorkdir } from "../lix/emptyWorkdir.js"
import { optimizeReq, optimizeRes } from "../git-http/optimizeReq.js"
import { checkOutPlaceholders } from "../lix/checkoutPlaceholders.js"

// TODO: i consider pull now bad practice nad deprecated. replace with more specific commands for syncing and updating local state
export async function pull(
	ctx: RepoContext,
	state: RepoState,
	cmdArgs: { singleBranch?: boolean; fastForward?: boolean; author?: Author }
) {
	if (!ctx.gitUrl) {
		throw new Error("Could not find repo url, only github supported for pull at the moment")
	}

	const branchName =
		state.ref || (await isoGit.currentBranch({ fs: ctx.rawFs, dir: "/" })) || "HEAD"

	const oid = await isoGit.resolveRef({
		fs: ctx.rawFs,
		dir: ctx.dir,
		ref: "refs/remotes/origin/" + branchName,
	})
	const { commit } = await isoGit.readCommit({ fs: ctx.rawFs, dir: "/", oid })
	const since = new Date(commit.committer.timestamp * 1000)

	const { fetchHead, fetchHeadDescription } = await isoGit.fetch({
		since,
		fs: ctx.rawFs,
		cache: ctx.cache,
		http: makeHttpClient({
			debug: ctx.debug,
			description: "pull",
			onReq: ctx.experimentalFeatures.lazyClone
				? optimizeReq.bind(null, {
						noBlobs: true,
						addRefs: [branchName],
				  })
				: undefined,
			onRes: ctx.experimentalFeatures.lazyClone ? optimizeRes : undefined,
		}),
		corsProxy: ctx.gitProxyUrl,
		ref: branchName,
		tags: false,
		dir: ctx.dir,
		url: ctx.gitUrl,
		// remote: "origin",
		// remoteRef,
		singleBranch: cmdArgs.singleBranch || true,
	})

	if (!fetchHead) {
		throw new Error("could not fetch head")
	}

	let materialized: string[] = []

	// FIXME: there is still a race condition somewhere that can lead to materialized files being deleted
	if (ctx.experimentalFeatures.lazyClone) {
		materialized = await emptyWorkdir(ctx, state)
		ctx.debug && console.info("experimental checkout after pull preload:", materialized)
		state.checkedOut.clear()
	}

	// (see documentation/lix-concepts.md for conflict resolution logic of lix)
	/**
	 * @typedef {Object} MergeDriverParams
	 * @property {Array<string>} branches
	 * @property {Array<string>} contents
	 * @property {string} path
	 */
	/**
	 * @callback MergeDriverCallback
	 * @param {MergeDriverParams} args
	 * @return {{cleanMerge: boolean, mergedText: string} | Promise<{cleanMerge: boolean, mergedText: string}>}
	 */
	const mergeDriver = ({
		branches,
		contents,
		path,
	}: {
		branches: string[]
		contents: string[]
		path: string
	}) => {
		// TODO: use analog to couchdb intermediate winner resoluiton: "Each revision includes a list of previous revisions. The revision with the longest revision history list becomes the winning revision. If they are the same, the _rev values are compared in ASCII sort order, and the highest wins"
		console.info("mergeDriver", branches, contents, path)
		ctx.rawFs.writeFile(path + `.${branches[2]!.slice(0, 4)}.conflict`, contents[2] || "")

		return { cleanMerge: true, mergedText: contents[1] || "" }
	}

	const mergeRes = await isoGit
		.merge({
			fs: state.nodeishFs,
			cache: ctx.cache,
			dir: ctx.dir,
			ours: branchName,
			theirs: fetchHead,
			fastForward: cmdArgs.fastForward === false ? false : true,
			message: `Merge ${fetchHeadDescription}`,
			author: cmdArgs.author || ctx.author,
			dryRun: false,
			noUpdateBranch: false,
			abortOnConflict: true,
			mergeDriver: ctx.experimentalFeatures.lixMerge ? mergeDriver : undefined, // different to native git this replaces the default 3 way merge
			// committer,
			// signingKey,
			// fastForwardOnly,
		})
		.catch((error) => ({ error }))

	// @ts-ignore
	console.info("mergeRes", { data: mergeRes.data, code: mergeRes.code, error: mergeRes.error })

	if (ctx.experimentalFeatures.lazyClone) {
		await checkOutPlaceholders(ctx, state, { preload: materialized })
	} else {
		await _checkout({
			fs: ctx.rawFs,
			cache: ctx.cache,
			dir: ctx.dir,
			ref: branchName,
			noCheckout: false,
		})
	}
}
