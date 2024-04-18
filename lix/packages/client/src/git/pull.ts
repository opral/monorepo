import isoGit from "../../vendored/isomorphic-git/index.js"
import type { RepoContext, RepoState, Author } from "../openRepository.js"
import { makeHttpClient } from "../git-http/client.js"
import { doCheckout } from "./checkout.js"
import { emptyWorkdir } from "../lix/emptyWorkdir.js"

export async function pull(
	ctx: RepoContext,
	state: RepoState,
	cmdArgs: { singleBranch?: boolean; fastForward?: boolean; author?: Author } = {}
) {
	if (!ctx.gitUrl) {
		throw new Error("Could not find repo url, only github supported for pull at the moment")
	}
	const pullFs = state.nodeishFs

	const { fetchHead, fetchHeadDescription } = await isoGit.fetch({
		depth: 5, // TODO: how to handle depth with upstream? reuse logic from fork sync
		fs: pullFs,
		cache: ctx.cache,
		http: makeHttpClient({ verbose: ctx.debug, description: "pull" }),
		corsProxy: ctx.gitProxyUrl,
		ref: state.branchName,
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
		ours: state.branchName,
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
		console.warn(
			"enableExperimentalFeatures.lazyClone is set for this repo but pull not fully implemented. disabling lazy files"
		)

		await emptyWorkdir(ctx, state)

		// remember we are now leaving lazy mode
		ctx.experimentalFeatures.lazyClone = false

		true && console.info('checking out "HEAD" after pull')
		await doCheckout({
			fs: ctx.rawFs,
			cache: ctx.cache,
			dir: ctx.dir,
			ref: state.branchName,
			noCheckout: false,
		})
	} else {
		await doCheckout({
			fs: ctx.rawFs,
			cache: ctx.cache,
			dir: ctx.dir,
			ref: state.branchName,
			noCheckout: false,
		})
	}
}
