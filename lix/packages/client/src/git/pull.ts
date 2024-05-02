import isoGit from "../../vendored/isomorphic-git/index.js"
import type { RepoContext, RepoState, Author } from "../openRepository.js"
import { makeHttpClient } from "../git-http/client.js"
import { doCheckout } from "./checkout.js"
import { emptyWorkdir } from "../lix/emptyWorkdir.js"
import { optimizeReq, optimizeRes } from "../git-http/optimizeReq.js"
import { checkOutPlaceholders } from "../lix/checkoutPlaceholders.js"

// TODO: i consider pull now bad practice nad deprecated. replace with more specific commands for syncing and updating local state
export async function pull(
	ctx: RepoContext,
	state: RepoState,
	cmdArgs: { singleBranch?: boolean; fastForward?: boolean; author?: Author } = {}
) {
	if (!ctx.gitUrl) {
		throw new Error("Could not find repo url, only github supported for pull at the moment")
	}
	const pullFs = state.nodeishFs

	const branchName =
		state.branchName || (await isoGit.currentBranch({ fs: ctx.rawFs, dir: "/" })) || "main"

	const oid = await isoGit.resolveRef({ fs: ctx.rawFs, dir: "/", ref: branchName })
	const { commit } = await isoGit.readCommit({ fs: ctx.rawFs, dir: "/", oid })
	const since = new Date(commit.committer.timestamp * 1000)

	const { fetchHead, fetchHeadDescription } = await isoGit.fetch({
		since,
		fs: pullFs,
		cache: ctx.cache,
		http: makeHttpClient({
			debug: ctx.debug,
			description: "pull",
			onReq: ctx.experimentalFeatures.lazyClone
				? optimizeReq.bind(null, {
						noneBlobFilter: true,
						filterRefList: { ref: branchName },
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

	await isoGit.merge({
		fs: pullFs,
		cache: ctx.cache,
		dir: ctx.dir,
		ours: branchName,
		theirs: fetchHead,
		fastForward: cmdArgs.fastForward,
		message: `Merge ${fetchHeadDescription}`,
		author: cmdArgs.author || ctx.author,
		dryRun: false,
		noUpdateBranch: false,
		// committer,
		// signingKey,
		// fastForwardOnly,
	})

	if (ctx.experimentalFeatures.lazyClone) {
		await emptyWorkdir(ctx, state)
		ctx.debug && console.info('checking out "HEAD" after pull')
		state.checkedOut.clear()
		await checkOutPlaceholders(ctx, state)
	} else {
		await doCheckout({
			fs: ctx.rawFs,
			cache: ctx.cache,
			dir: ctx.dir,
			ref: branchName,
			noCheckout: false,
		})
	}
}
