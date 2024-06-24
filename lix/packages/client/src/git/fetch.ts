import isoGit from "../../vendored/isomorphic-git/index.js"
import { makeHttpClient } from "../git-http/client.js"
import { optimizeReq, optimizeRes } from "../git-http/optimizeReq.js"
import type { RepoContext, RepoState } from "../openRepository.js"

export async function fetch(
	ctx: RepoContext,
    state: RepoState,
    cmdArgs?: {
        ref: string
        remoteRef?: string
		depth?: number
		relative?: true
        singleBranch?: boolean
	}
) {
    const ref = cmdArgs?.ref || state.branchName || (await isoGit.currentBranch({ fs: ctx.rawFs, dir: "/" })) || "HEAD"


    if (cmdArgs?.remoteRef && cmdArgs?.ref) {
        await isoGit.setConfig({
            fs: ctx.rawFs,
            dir: ctx.dir,
            path: "remote.origin.fetch",
            value: `+${cmdArgs?.ref}:${cmdArgs.remoteRef}`, // "refs/notes/commits:refs/notes/commits", refs/notes/*
            append: true,
        })
    }

    let since
    if (!cmdArgs?.depth) {
        const oid = await isoGit.resolveRef({
            fs: ctx.rawFs,
            dir: ctx.dir,
            ref: "refs/remotes/origin/" + ref,
        })
        const { commit } = await isoGit.readCommit({ fs: ctx.rawFs, dir: "/", oid })
        since = new Date(commit.committer.timestamp * 1000)
    }
    

	const res = await isoGit.fetch({
		since,
		fs: ctx.rawFs,
		cache: ctx.cache,
		http: makeHttpClient({
			debug: ctx.debug,
			description: "fetch",
			onReq: ctx.experimentalFeatures.lazyClone
				? optimizeReq.bind(null, {
						noBlobs: true,
						addRefs: [ref],
				  })
				: undefined,
			onRes: ctx.experimentalFeatures.lazyClone ? optimizeRes : undefined,
		}),
		corsProxy: ctx.gitProxyUrl,
		ref,
		tags: false,
		dir: ctx.dir,
		url: ctx.gitUrl,
		// remote: "origin",
		remoteRef: cmdArgs?.remoteRef,
        depth: cmdArgs?.depth,
        relative: cmdArgs?.relative, // Changes the meaning of depth to be measured from the current shallow depth rather than from the branch tip.
        // prune
        // pruneTags
		singleBranch: cmdArgs?.singleBranch || true,
	})

    // console.log({ res })
    // defaultBranch : "refs/heads/main"
    // fetchHead "f075dad41a58ed0c5590d11e3657c3cc11ef0a3e"
    // fetchHeadDescription   "branch 'main' of http://gitea.localhost/jan/cal.com"

    return res
}
