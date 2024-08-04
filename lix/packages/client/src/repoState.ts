import { withProxy } from "./helpers.js"
import { makeHttpClient } from "./git-http/client.js"
import { optimizeReq, optimizeRes } from "./git-http/optimizeReq.js"
import { _checkout } from "./git/checkout.js"
import type { RepoContext } from "./repoContext.js"
import isoGit from "../vendored/isomorphic-git/index.js"
import { checkOutPlaceholders } from "./lix/checkoutPlaceholders.js"
import type { NodeishFilesystem } from "@lix-js/fs"
import { blobExistsLocaly } from "./git-http/helpers.js"

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

	const nodeishFs = withProxy({
		nodeishFs: rawFs,
		verbose: debug,
		description: "app",
		intercept: useLazyFS ? delayedAction : undefined,
	})

	let preloads: string[] = []
	let nextBatch: (string | Promise<any>)[] = []

	const state: {
		ensureFirstBatch: (arg?: { preload?: string[] }) => Promise<void>
		pending: Promise<void | { error: Error }> | undefined
		nodeishFs: NodeishFilesystem
		checkedOut: Set<string>
		branchName: string | undefined
		currentRef: string
		defaultBranch: string
		sparseFilter: typeof args.sparseFilter
	} = {
		ensureFirstBatch,
		pending: undefined,
		nodeishFs,
		checkedOut: new Set(),
		branchName: args.branch,
		currentRef: "HEAD",
		defaultBranch: "refs/remotes/origin/HEAD",
		sparseFilter: args.sparseFilter,
	}

	// todo: discussion: use functions or repo state for these:?!
	// state currentRef
	// state baseBranch default to global base branch, other branch if on detached head on other banrch
	// state defaultBranch

	// to get main base branch ref refs/remotes/origin/HEAD
	// Bail commit/ push on errors that are relevant or unknown

	async function ensureFirstBatch(args?: { preload?: string[] }) {
		if (!useLazyFS) {
			return
		}

		preloads = preloads.concat(args?.preload || [])

		if (state.pending) {
			await state.pending.catch((error) => console.error(error))
		} else {
			if (preloads.length) {
				nextBatch.push("")
				state.pending = doCheckout().finally(() => {
					state.pending = undefined
				})
			}
		}
	}

	async function doCheckout() {
		if (nextBatch.length < 1) {
			return
		}

		const thisBatch: string[] = []
		const oidPromises: Promise<any>[] = []

		for (const entry of nextBatch) {
			if (entry === "") {
				continue
			}
			if (typeof entry === "string") {
				if (!state.checkedOut.has(entry)) {
					thisBatch.push(entry)
				}
			} else {
				oidPromises.push(entry)
			}
		}

		nextBatch = []
		if (debug) {
			oidPromises.length && console.warn("fetching oids ", oidPromises)
		}

		if (oidPromises.length > 0) {
			await Promise.all(oidPromises).catch(console.error)
		}

		// dedupe files which happens if git-ignores are also read or preloaded in the first batch
		const allBatchFiles = [...new Set([...preloads, ...thisBatch])]
		preloads = []

		if (debug) {
			console.warn("checking out ", JSON.stringify(allBatchFiles))
		}

		// FIXME: this has to be part of the checkout it self to prevent race condition!!
		const oids: string[] = []
		const placeholders: string[] = allBatchFiles.filter((entry) => rawFs._isPlaceholder?.(entry))
		for (const placeholder of placeholders) {
			const stats = await rawFs.stat(placeholder)

			// if (stats._rootHash) {
			// FIXME: check _rootHash!!! or do this in the checkout ?!?
			// for the first version this is not an issue thouhg:
			// if user commits localy all files that are changed are not placeholders, all other files are the same oids as when doing original checkout
			// if user fetches without checking out etc. the oids are not invalidated
			// if user does a different checkout the oids are allready up to date by emptyWorkdir and fresh checkoutPlaceholders
			// if user does checkout with active placehodlers wihtout removing them first, checkout will fail with dirty workdir message
			// }

			oids.push(stats._oid)
		}

		if (useLazyFS && oids.length > 0) {
			const toFetch: string[] = (
				await Promise.all(
					oids.map((oid) =>
						blobExistsLocaly({
							fs: rawFs,
							cache,
							oid,
							gitdir: ".git",
						}).then((exists) => (exists ? false : oid))
					)
				)
			).filter((a) => a !== false) as string[]

			if (toFetch.length) {
				// walk the oid for the paths if placeholder oid is missing or invalid
				await isoGit
					.fetch({
						cache,
						fs: rawFs,
						dir: "/",
						http: makeHttpClient({
							debug,
							description: "lazy fetch",
							onReq: optimizeReq.bind(null, {
								noBlobs: false,
								addRefs: [state.branchName || "HEAD"],
								overrideWants: toFetch,
							}),
							onRes: optimizeRes,
						}),
						depth: 1,
						singleBranch: true,
						tags: false,
					})
					.catch((error: any) => {
						console.error({ error, toFetch })
					})
			}
		}

		let res
		if (allBatchFiles.length > 0) {
			await Promise.all(
				placeholders.map((placeholder) =>
					rawFs.rm(placeholder).catch(() => {
						// ignore
					})
				)
			)

			res = await _checkout({
				fs: rawFs,
				dir,
				cache,
				ref: state.branchName,
				filepaths: allBatchFiles,
			}).catch((error: any) => {
				console.error({ error, allBatchFiles })
			})
		}

		for (const entry of allBatchFiles) {
			state.checkedOut.add(entry)
		}

		if (debug) {
			console.warn("checked out ", allBatchFiles)
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
				fs: rawFs,
				http: makeHttpClient({
					debug,
					description: "clone",
					onReq: experimentalFeatures.lazyClone
						? optimizeReq.bind(null, {
								noBlobs: true,
								addRefs: [state.branchName || "HEAD"],
						  })
						: undefined,
					onRes: experimentalFeatures.lazyClone ? optimizeRes : undefined,
				}),
				dir,
				cache,
				corsProxy: gitProxyUrl,
				url: gitUrl,
				singleBranch: false, // if we clone with single branch true we will not get the defatult branch set in isogit
				noCheckout: experimentalFeatures.lazyClone,
				ref: state.branchName,

				// TODO: use only first and last commit in lazy clone? (we need first commit for repo id)
				depth: 1,
				noTags: true,
			})
			.then(async () => {
				if (!experimentalFeatures.lazyClone) {
					return
				}
				// console.log(
				// 	"head",
				// 	await isoGit
				// 		.resolveRef({ fs: rawFs, dir: "/", ref: "HEAD", depth: 1 })
				// 		.catch(console.error)
				// )
				// console.log(
				// 	"base",
				// 	await isoGit
				// 		.resolveRef({ fs: rawFs, dir: "/", ref: "refs/remotes/origin/HEAD", depth: 1 })
				// 		.catch(console.error)
				// )
				// console.log(
				// 	"config",
				// 	await isoGit.getConfig({ fs: rawFs, dir: "/", path: "." }).catch(console.error)
				// )

				const { gitignoreFiles } = await checkOutPlaceholders(
					ctx,
					{
						branchName: state.branchName,
						checkedOut: state.checkedOut,
						sparseFilter: state.sparseFilter,
						ensureFirstBatch,
					} as RepoState,
					{ materializeGitignores: false }
				)

				// we load these on top of whatever first files are fetched in a batch, we dont need the before but need to make sure thay are available asap before workign with files
				preloads = gitignoreFiles
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
				console.info("delayedAction", {
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

			// TODO: we will tackle this with the refactoring / our own implementation of checkout
			if (prop !== "readdir") {
				nextBatch.push(filename)
			}

			// }

			if (!state.pending && nextBatch.length > 0) {
				state.pending = doCheckout()
			}
		} else if (
			experimentalFeatures.lazyClone &&
			typeof rootObject !== "undefined" &&
			rootObject === ".git" && // TODO #1459 more solid check for git folder !filePath.startsWith(gitdir))
			pathParts[1] === "objects" &&
			pathParts[2] !== "pack" &&
			pathParts.length === 4 &&
			prop === "readFile"
		) {
			// This case currenlty only triggeres if we encounter a missing oid in the merge algorythm, for all other cases we use the placeholder replacement steps to load oids
			// TODO: disbable this case for all except for once that use it

			//  FIXME: is handling dir option really neceasary anywhere?
			//  if (dir !== undefined) {
			//  	const dirWithLeadingSlash = dir.endsWith("/") ? dir : dir + "/"
			//  	if (!filePath.startsWith(dirWithLeadingSlash)) {
			//  		throw new Error(
			//  			"Filepath " +
			//  				filePath +
			//  				" did not start with repo root dir " +
			//  				dir +
			//  				" living in git repo?"
			//  		)
			//  	}
			//  	gitFilePath = filePath.slice(dirWithLeadingSlash.length)
			//  }
			//  we have a readFile in the .git folder - we only intercet readings on the blob files
			//  git checkout (called after a file was requested that doesn't exist on the client yet)
			//  1. tries to read the loose object with its oid as identifier  (see: https://github.com/isomorphic-git/isomorphic-git/blob/9f9ebf275520244e96c5b47df0bd5a88c514b8d2/src/storage/readObject.js#L37)
			//  2. tries to find the blob in one of the downloaded pack files (see: https://github.com/isomorphic-git/isomorphic-git/blob/9f9ebf275520244e96c5b47df0bd5a88c514b8d2/src/storage/readObject.js#L37)
			//  if both don't exist it fill fail
			//  we intercept read of loose objects in 1. to check if the object exists loose or packed using blobExistsLocaly()
			//  if we know it doesn't exist - and also 2. would fail - we fetch the blob from remote - this will add it as a pack file and 2. will succeed
			//  To detect a read of a blob file we can check the path if it is an blob request and which one
			//  --0-- ---1--- -2 ---------------3----------------------
			//  .git/objects/5d/ec81f47085ae328439d5d9e5012143aeb8fef0
			//  extract the oid from the path and check if we can resolve the object loacly alread

			const oid = pathParts[2] + pathParts[3]

			// FIXME: can we skip this in some situations? this could speed up things
			nextBatch.push(
				blobExistsLocaly({
					fs: rawFs,
					cache,
					oid,
					gitdir: ".git",
				}).then((existsLocaly) => {
					if (!existsLocaly) {
						debug && console.info("missing oid!! in git object store interceptor: ", oid)

						return isoGit.fetch({
							cache,
							fs: rawFs,
							dir: "/",
							http: makeHttpClient({
								debug,
								description: "lazy fetch",
								onReq: optimizeReq.bind(null, {
									noBlobs: false,
									addRefs: [state.branchName || "HEAD"],
									// we don't need to override the haves any more since adding the capabilities
									// allow-tip-sha1-in-want allow-reachable-sha1-in-want to the request enable us to request objects explicetly
									overrideWants: [oid],
								}),
								onRes: optimizeRes,
							}),
							depth: 1,
							singleBranch: true,
							tags: false,
						})
					}
					return undefined
				})
			)
			if (!state.pending) {
				state.pending = doCheckout()
			}
		} else {
			// excluded files execute immediately without waiting for other lazy actions either
			return execute()
		}

		if (state.pending) {
			// move to better queue?
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
