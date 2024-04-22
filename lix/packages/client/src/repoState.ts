import { withProxy } from "./helpers.js"
import { makeHttpClient } from "./git-http/client.js"
import { optimizedRefsRes, optimizedRefsReq } from "./git-http/optimize-refs.js"
import { doCheckout as lixCheckout } from "./git/checkout.js"
import type { RepoContext } from "./repoContext.js"
import isoGit from "../vendored/isomorphic-git/index.js"
import { checkOutPlaceholders } from "./lix/checkoutPlaceholders.js"
import type { NodeishFilesystem } from "@lix-js/fs"

const checkout = lixCheckout
// const checkout = isoGit.checkout

export type RepoState = Awaited<ReturnType<typeof repoState>>

export async function repoState(
	ctx: RepoContext,
	args: {
		branch?: string
		sparseFilter?: (entry: { filename: string; type: "file" | "folder" | "symlink" }) => boolean
	}
) {
	const {
		gitUrl,
		debug,
		rawFs,
		experimentalFeatures,
		gitProxyUrl,
		freshClone,
		useLazyFS,
		dir,
		cache,
	} = ctx

	const state: {
		pending: Promise<void | { error: Error }> | undefined
		nodeishFs: NodeishFilesystem
		checkedOut: Set<string>
		branchName: string | undefined
		sparseFilter: typeof args.sparseFilter
	} = {
		pending: undefined,
		nodeishFs: withProxy({
			nodeishFs: rawFs,
			verbose: debug,
			description: "app",
			intercept: useLazyFS ? delayedAction : undefined,
		}),
		checkedOut: new Set(),
		branchName: args.branch,
		sparseFilter: args.sparseFilter,
	}

	// Bail commit/ push on errors that are relevant or unknown

	let nextBatch: string[] = []
	async function doCheckout() {
		if (nextBatch.length < 1) {
			return
		}

		const thisBatch = [...nextBatch]
		nextBatch = []
		if (debug) {
			console.warn("checking out ", thisBatch)
		}

		// FIXME: this has to be part of the checkout it self - to prevent race condition!!
		for (const placeholder of thisBatch.filter((entry) => rawFs._isPlaceholder?.(entry))) {
			await rawFs.rm(placeholder)
		}

		const res = await checkout({
			fs: withProxy({
				nodeishFs: rawFs,
				verbose: debug,
				description: debug ? "checkout: " + JSON.stringify(thisBatch) : "checkout",
			}),
			dir,
			cache,
			ref: state.branchName,
			filepaths: thisBatch,
		}).catch((error: any) => {
			console.error({ error, thisBatch })
		})

		for (const entry of thisBatch) {
			state.checkedOut.add(entry)
		}

		if (debug) {
			console.warn("checked out ", thisBatch)
		}

		if (nextBatch.length) {
			return doCheckout()
		}

		return res
	}

	if (freshClone) {
		if (!rawFs._createPlaceholder && !rawFs._isPlaceholder) {
			throw new Error("fs provider does not support placeholders")
		}
		console.info("Using lix for cloning repo")

		await isoGit
			.clone({
				fs: withProxy({ nodeishFs: rawFs, verbose: debug, description: "clone" }),
				http: makeHttpClient({
					debug,
					description: "clone",

					onReq: ({ url, body }: { url: string; body: any }) => {
						return optimizedRefsReq({ url, body, addRef: state.branchName })
					},

					onRes: optimizedRefsRes,
				}),
				dir,
				cache,
				corsProxy: gitProxyUrl,
				url: gitUrl,
				singleBranch: true,
				noCheckout: experimentalFeatures.lazyClone,
				ref: state.branchName,

				// TODO: use only first and last commit in lazy clone? (we need first commit for repo id)
				depth: 1,
				noTags: true,
			})
			.then(() => {
				if (!experimentalFeatures.lazyClone) {
					return
				}
				return checkOutPlaceholders(ctx, {
					branchName: state.branchName,
					checkedOut: state.checkedOut,
					sparseFilter: state.sparseFilter,
				} as RepoState)
			})
	} else {
		console.info("Using existing cloned repo")
	}

	function delayedAction({
		execute,
		prop,
		argumentsList,
	}: {
		execute: () => any
		prop: any
		argumentsList: any[]
	}) {
		const filename = argumentsList?.[0]?.replace(/^(\.)?(\/)?\//, "")
		const pathParts = filename?.split("/") || []
		const rootObject = pathParts[0]

		// TODO: we need to delay readdir to prevent race condition for removing placeholders, remove when we have our own checkout implementation
		if (
			experimentalFeatures.lazyClone &&
			typeof rootObject !== "undefined" &&
			rootObject !== ".git" &&
			["readFile", "readlink", "writeFile", "readdir"].includes(prop) &&
			!state.checkedOut.has(rootObject) &&
			!state.checkedOut.has(filename)
		) {
			if (debug) {
				console.warn("delayedAction", {
					prop,
					argumentsList,
					rootObject,
					checkedOut: state.checkedOut,
					filename,
					pending: state.pending,
					nextBatch,
				})
			}
			// TODO: optimize writes? only needs adding the head hash to staging instead of full checkout....
			// if (prop === "writeFile") {
			// 	checkedOut.add(filename)
			// } else {

			// TODO we will tackle this with the refactoring / our own implementation of checkout
			if (prop !== "readdir") {
				nextBatch.push(filename)
			}

			// }

			//  && nextBatch.length > 0
			if (!state.pending) {
				state.pending = doCheckout()
			}
		} else {
			// excluded files execute immediately without waiting for other lazy actions either
			return execute()
		}

		if (state.pending) {
			// TODO: move to real queue?
			return state.pending.then(execute).finally(() => {
				state.pending = undefined
				if (debug) {
					console.warn("executed", filename, prop)
				}
			})
		}

		return execute()
	}

	return state
}
