// git-only functions
import { commit, isoCommit } from "./git/commit.js"
import { statusList } from "./git/status-list.js"
import { status } from "./git/status.js"
import { add } from "./git/add.js"
import { remove } from "./git/remove.js"
import { push } from "./git/push.js"
import { pull } from "./git/pull.js"
import { listRemotes } from "./git/listRemotes.js"
import { log } from "./git/log.js"
import { fetch } from "./git/fetch.js"
import { fetchRefs } from "./git/fetchRefs.js"
import { getOrigin } from "./git/getOrigin.js"
import { listBranches } from "./git/listBranches.js"
import { getCurrentBranch } from "./git/getCurrentBranch.js"
import { resolveRef } from "./git/resolveRef.js"
import { coreRefs } from "./git/coreRefs.js"
import { checkout } from "./git/checkout.js"

import { readNote } from "./git/notes.js"

// github depenedent
import { getMeta } from "./github/getMeta.js"
import { forkStatus } from "./github/forkStatus.js"
import { createFork } from "./github/createFork.js"
import { mergeUpstream } from "./github/mergeUpstream.js"

// lix specific functions
import { getFirstCommitHash } from "./lix/getFirstCommitHash.js"
import { emptyWorkdir } from "./lix/emptyWorkdir.js"
import { checkOutPlaceholders } from "./lix/checkoutPlaceholders.js"

import { repoContext } from "./repoContext.js"
import { repoState } from "./repoState.js"
import { lixFs } from "./lixFs.js"

// types
import type { NodeishFilesystem } from "@lix-js/fs"

export type { RepoContext } from "./repoContext.js"
export type { RepoState } from "./repoState.js"
export type Repository = Awaited<ReturnType<typeof openRepository>>

export class LixError extends Error {
	// we currently mix standard errors with github errors and isomorphic git errors, we will start to transition into a clean lix error class as we replace implementations
	// the response object is added for transitional compatitbility with github sdk errors
	response?: { status?: number }
}

export type Author = {
	name?: string
	email?: string
	timestamp?: number
	timezoneOffset?: number
}

// TODO: --filter=tree:0 for commit history?

export async function openRepository(
	url: string,
	args: {
		author?: any
		nodeishFs?: NodeishFilesystem
		workingDirectory?: string
		ref?: string
		debug?: boolean

		// Do not expose internal args, if using in app code needs ts ignore and comment
		// sparseFilter?: any

		experimentalFeatures?: {
			lixFs?: boolean
			lazyClone?: boolean
			lixCommit?: boolean
		}
	}
) {
	// Promise<Repository>
	const ctx = await repoContext(url, args)
	const state = await repoState(ctx, args as Parameters<typeof repoState>[1])

	return {
		_experimentalFeatures: ctx.experimentalFeatures,
		_rawFs: ctx.rawFs,
		nodeishFs: state.nodeishFs,

		commit: commit.bind(undefined, ctx, state),
		resolveRef: resolveRef.bind(undefined, ctx),
		coreRefs: coreRefs.bind(undefined, ctx),
		status: status.bind(undefined, ctx, state),
		statusList: statusList.bind(undefined, ctx, state),
		forkStatus: forkStatus.bind(undefined, ctx),
		getMeta: getMeta.bind(undefined, ctx),
		listRemotes: listRemotes.bind(undefined, ctx, state),
		log: log.bind(undefined, ctx),
		fetch: fetch.bind(undefined, ctx, state),
		fetchRefs: fetchRefs.bind(undefined, ctx),
		readNote: readNote.bind(undefined, ctx, state),
		getOrigin: getOrigin.bind(undefined, ctx, state),
		listBranches: listBranches.bind(undefined, ctx),
		getCurrentBranch: getCurrentBranch.bind(undefined, ctx),
		getFirstCommitHash: getFirstCommitHash.bind(undefined, ctx),
		checkout: checkout.bind(undefined, ctx, state),
		createFork: createFork.bind(undefined, ctx),
		mergeUpstream: mergeUpstream.bind(undefined, ctx),
		push: push.bind(undefined, ctx, state),
		pull: pull.bind(undefined, ctx, state),

		...(ctx.experimentalFeatures.lixFs ? lixFs(state.nodeishFs) : {}),

		// only exposed for testing
		_emptyWorkdir: emptyWorkdir.bind(undefined, ctx, state),
		_checkOutPlaceholders: checkOutPlaceholders.bind(undefined, ctx, state),
		_add: add.bind(undefined, ctx, state),
		_remove: remove.bind(undefined, ctx, state),
		_isoCommit: isoCommit.bind(undefined, ctx),
	}
}
