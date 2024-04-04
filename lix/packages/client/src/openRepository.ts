import type { NodeishFilesystem } from "@lix-js/fs"
import type { Repository, LixError } from "./api.js"
import { transformRemote, withProxy, parseLixUri } from "./helpers.js"
// @ts-ignore
import { makeHttpClient } from "./git-http/client.js"
import { optimizedRefsRes, optimizedRefsReq } from "./git-http/optimize-refs.js"
import { Octokit } from "octokit"

import { createSignal, createEffect } from "./solid.js"

import type { OptStatus } from "./git/status-list.js"
import { commit as lixCommit } from "./git/commit.js"
import { statusList as lixStatusList } from "./git/status-list.js"
import { checkout as lixCheckout } from "./git/checkout.js"

import isoGit from "../vendored/isomorphic-git/index.js"

// @ts-ignore
import { modeToFileType } from "./git/helpers.js"

// const checkout = isoGit.checkout
const checkout = lixCheckout

// TODO: --filter=tree:0 for commit history?

const whitelistedExperimentalRepos = [
	"inlang/example",
	"inlang/ci-test-repo",
	"opral/monorepo",
	"inlang/example-test",

	"janfjohannes/inlang-example",
	"janfjohannes/cal.com",

	"niklasbuchfink/appflowy",
]

export async function findRepoRoot(args: {
	nodeishFs: NodeishFilesystem
	path: string
}): Promise<string | undefined> {
	const gitroot = await isoGit
		.findRoot({
			fs: args.nodeishFs,
			filepath: args.path,
		})
		.catch(() => undefined)

	return gitroot ? "file://" + gitroot : undefined
}

export async function openRepository(
	url: string,
	args: {
		// TODO add Type and documentation
		author?: any
		nodeishFs?: NodeishFilesystem
		workingDirectory?: string
		branch?: string
		auth?: unknown // unimplemented

		// Do not expose experimental arg types
		[x: string]: any
		// sparseFilter?: any
		// debug?: boolean
		// experimentalFeatures?: {
		// 	lixFs?: boolean
		// 	lazyClone?: boolean
		// 	lixCommit?: boolean
		// }
	}
): Promise<Repository> {
	const rawFs = args.nodeishFs || (await import("@lix-js/fs")).createNodeishMemoryFs()
	const author = args.author

	// eslint-disable-next-line prefer-const -- used for development
	let debug: boolean = args.debug || false

	if (
		!url ||
		(!url.startsWith("file://") && !url.startsWith("https://") && !url.startsWith("http://"))
	) {
		throw new Error("repo url is required, use file:// for local repos")
	}

	if (debug && typeof window !== "undefined") {
		// @ts-ignore -- for debup purose we expose the raw fs to the window object
		window["rawFs"] = rawFs
	}

	// fixme: propper error handling with error return values and no signal dependency
	const [errors, setErrors] = createSignal<Error[]>([])

	// TODO: use propper shallow .git format and checks

	// the url format for lix urls is
	// https://lix.inlang.com/git/github.com/opral/monorepo
	// proto:// lixServer / namespace / repoHost / owner / repoName
	// namespace is ignored until switching from git.inlang.com to lix.inlang.com and can eveolve in future to be used for repoType, api type or feature group
	// the url format for direct github urls without a lix server is https://github.com/inlang/examplX (only per domain-enabled git hosters will be supported, currently just gitub)
	// the url for opening a local repo allready in the fs provider is file://path/to/repo (not implemented yet)

	// TODO: check for same origin
	let freshClone = false

	let branchName = args.branch

	// the directory we use for all git operations as repo root, if we are interested in a repo subdirectory we have to append this
	// TODO: add more tests for non root dir command
	let dir = "/"

	if (url.startsWith("file:")) {
		dir = url.replace("file://", "")

		const remotes = await isoGit
			.listRemotes({
				fs: rawFs,
				dir: url.replace("file://", ""),
			})
			.catch(() => [])
		const origin = remotes.find(({ remote }) => remote === "origin")?.url || ""

		if (origin.startsWith("git@github.com:")) {
			url = origin.replace("git@github.com:", "https://github.com/")
		} else {
			url = origin
		}
	} else {
		// Simple check for existing git repos
		const maybeGitDir = await rawFs.stat(".git").catch((error: any) => ({ error }))
		if ("error" in maybeGitDir) {
			freshClone = true
		}
	}

	// Ignoring parsing errror and just using what we can get from the url, as we support also some edge cases for local repos that are not 100% clear yet
	// see line 90 for explanation of lix uri parts
	const { protocol, lixHost, repoHost, owner, repoName, username, password, namespace } =
		parseLixUri(url)
	if (debug && (username || password)) {
		console.warn(
			"username and password and providers other than github are not supported yet. Only local commands will work."
		)
	}

	// console.log({ namespace, protocol, lixHost, repoHost, owner, repoName, username, password, error })

	const isWhitelistedRepo = whitelistedExperimentalRepos.includes(
		`${owner}/${repoName}`.toLocaleLowerCase()
	)
	const experimentalFeatures =
		args.experimentalFeatures || (isWhitelistedRepo ? { lazyClone: true, lixCommit: true } : {})
	const lazyFS =
		typeof experimentalFeatures.lazyClone === "undefined"
			? freshClone
			: experimentalFeatures.lazyClone
	const cache = lazyFS ? {} : undefined

	let gitProxyUrl: string | undefined
	let gitHubProxyUrl: string | undefined

	if (namespace === "git") {
		gitProxyUrl = lixHost ? `${protocol}//${lixHost}/git-proxy` : ""
		gitHubProxyUrl = lixHost ? `${protocol}//${lixHost}/github-proxy` : ""
	}

	debug &&
		console.info({
			gitProxyUrl,
			gitHubProxyUrl,
			protocol,
			lixHost,
			repoHost,
			owner,
			repoName,
			username,
			password,
		})

	const github = new Octokit({
		request: {
			fetch: (...ghArgs: any) => {
				ghArgs[0] = gitHubProxyUrl + "/" + ghArgs[0]
				if (!ghArgs[1]) {
					ghArgs[1] = {}
				}

				if (gitHubProxyUrl) {
					// required for authenticated cors requests
					ghArgs[1].credentials = "include"
				}

				// @ts-ignore
				return fetch(...ghArgs)
			},
		},
	})

	// TODO: support for url scheme to use local repo already in the fs
	const gitUrl = repoName ? `https://${repoHost}/${owner}/${repoName}` : ""

	if (!gitUrl && debug) {
		console.warn(
			"valid repo url / local repo not found, only fs features available outside of repo"
		)
	}

	const expFeatures = Object.entries(experimentalFeatures) // eslint-disable-next-line @typescript-eslint/no-unused-vars
		.filter(([_, value]) => value)
		.map(([key]) => key)
	if (expFeatures.length) {
		console.warn("using experimental git features for this repo.", expFeatures)
	}

	// Bail commit/ push on errors that are relevant or unknown

	let pending: Promise<void | { error: Error }> | undefined
	const checkedOut = new Set()
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
			ref: args.branch,
			filepaths: thisBatch,
		}).catch((error) => {
			console.error({ error, thisBatch })
		})

		for (const entry of thisBatch) {
			checkedOut.add(entry)
		}

		if (debug) {
			console.warn("checked out ", thisBatch)
		}

		if (nextBatch.length) {
			return doCheckout()
		}

		return res
	}

	async function checkOutPlaceholders() {
		if (!experimentalFeatures.lazyClone) {
			return
		}
		await checkout({
			fs: withProxy({
				nodeishFs: rawFs,
				verbose: debug,
				description: "checkout",
			}),
			cache,
			dir,
			ref: branchName,
			filepaths: [],
		})

		const fs = withProxy({ nodeishFs: rawFs, verbose: debug, description: "checkout placeholders" })

		const gitignoreFiles: string[] = []

		await isoGit.walk({
			fs,
			dir,
			cache,
			gitdir: ".git",
			trees: [isoGit.TREE({ ref: branchName })],
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			map: async function (fullpath, [commit]) {
				if (!commit) {
					return undefined
				}
				const fileMode = await commit.mode()

				const fileType: string = modeToFileType(fileMode)

				if (fullpath.endsWith(".gitignore")) {
					gitignoreFiles.push(fullpath)
					return undefined
				}

				if (
					args.sparseFilter &&
					!args.sparseFilter({
						filename: fullpath,
						type: fileType,
					})
				) {
					return undefined
				}

				if (fileType === "folder" && !checkedOut.has(fullpath)) {
					return fullpath
				}

				if (fileType === "file" && !checkedOut.has(fullpath)) {
					await fs._createPlaceholder(fullpath, { mode: fileMode })
					return fullpath
				}

				if (fileType === "symlink" && !checkedOut.has(fullpath)) {
					await fs._createPlaceholder(fullpath, { mode: fileMode })
					return fullpath
				}

				console.warn("ignored checkout palcholder path", fullpath, fileType)
				return undefined
			},
		})

		if (gitignoreFiles.length) {
			await checkout({
				fs: withProxy({
					nodeishFs: rawFs,
					verbose: debug,
					description: "checkout gitignores: " + JSON.stringify(gitignoreFiles),
				}),
				dir,
				cache,
				ref: args.branch,
				filepaths: gitignoreFiles,
			})
			gitignoreFiles.map((file) => checkedOut.add(file))
		}

		pending && (await pending)
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
						return optimizedRefsReq({ url, body, addRef: branchName })
					},

					onRes: optimizedRefsRes,
				}),
				dir,
				cache,
				corsProxy: gitProxyUrl,
				url: gitUrl,
				singleBranch: true,
				noCheckout: experimentalFeatures.lazyClone,
				ref: branchName,

				// TODO: use only first and last commit in lazy clone? (we need first commit for repo id)
				depth: 1,
				noTags: true,
			})
			.then(() => checkOutPlaceholders())
			.catch((newError: Error) => {
				setErrors((previous: any) => [...(previous || []), newError])
			})
	} else {
		console.info("Using existing cloned repo")
	}

	// delay all fs and repo operations until the repo clone and checkout have finished, this is preparation for the lazy feature
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
			!checkedOut.has(rootObject) &&
			!checkedOut.has(filename)
		) {
			if (debug) {
				console.warn("delayedAction", {
					prop,
					argumentsList,
					rootObject,
					checkedOut,
					filename,
					pending,
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
			if (!pending) {
				pending = doCheckout()
			}
		} else {
			// excluded files execute immediately without waiting for other lazy actions either
			return execute()
		}

		if (pending) {
			// TODO: move to real queue?
			return pending.then(execute).finally(() => {
				pending = undefined
				if (debug) {
					console.warn("executed", filename, prop)
				}
			})
		}

		return execute()
	}

	const nodeishFs = withProxy({
		nodeishFs: rawFs,
		verbose: debug,
		description: "app",
		intercept: lazyFS ? delayedAction : undefined,
	})

	const add = (filepath: string | string[]) =>
		isoGit.add({
			fs: withProxy({
				nodeishFs: rawFs,
				verbose: debug,
				description: "add",
			}),
			parallel: true,
			dir,
			cache,
			filepath,
		})

	const remove = (filepath: string) =>
		isoGit.remove({
			fs: withProxy({
				nodeishFs: rawFs,
				verbose: debug,
				description: "remove",
			}),
			dir,
			cache,
			filepath,
		})

	async function emptyWorkdir() {
		const statusResult = await statusList()
		if (statusResult.length > 0) {
			throw new Error("could not empty the workdir, uncommitted changes")
		}

		const listing = (await rawFs.readdir("/")).filter((entry) => {
			return !checkedOut.has(entry) && entry !== ".git"
		})

		const notIgnored = (
			await Promise.all(
				listing.map((entry) =>
					isoGit.isIgnored({ fs: rawFs, dir, filepath: entry }).then((ignored) => {
						return { ignored, entry }
					})
				)
			)
		)
			.filter(({ ignored }) => !ignored)
			.map(({ entry }) => entry)

		for (const toDelete of notIgnored) {
			await rawFs.rm(toDelete, { recursive: true }).catch(() => {})

			// remove it from isoGit's index as well
			await isoGit.remove({
				fs: rawFs,
				// ref: args.branch,
				dir: "/",
				cache,
				filepath: toDelete,
			})
		}
	}

	type StatusArgs = {
		// ref?: string support custom refs
		filepaths?: string[]
		filter?: (filepath: string) => boolean
		sparseFilter?: (entry: { filename: string; type: "file" | "folder" }) => boolean
		includeStatus?: OptStatus[]
	}
	async function statusList(statusArg?: StatusArgs): ReturnType<typeof lixStatusList> {
		return lixStatusList({
			fs: withProxy({
				nodeishFs: rawFs,
				verbose: debug,
				description: "lixStatusList",
			}),
			dir,
			cache,
			sparseFilter: args?.sparseFilter,
			filter: statusArg?.filter,
			filepaths: statusArg?.filepaths,
			includeStatus: statusArg?.includeStatus,
		})
	}

	async function status(filepath: string) {
		if (typeof filepath !== "string") {
			throw new Error("parameter must be a string")
		}
		const statusList = await lixStatusList({
			fs: withProxy({
				nodeishFs: rawFs,
				verbose: debug,
				description: "lixStatus",
			}),
			dir,
			cache,
			sparseFilter: args.sparseFilter,
			filepaths: [filepath],
		})

		const maybeStatusEntry: [string, string] = statusList[0] || [filepath, "unknown"]
		return maybeStatusEntry?.[1] as string
	}

	if (args.debugTime) {
		console.timeEnd("repo")
	}

	return {
		_experimentalFeatures: experimentalFeatures,
		_rawFs: rawFs,
		_emptyWorkdir: emptyWorkdir,
		_checkOutPlaceholders: checkOutPlaceholders,
		_add: add,
		_remove: remove,
		// @ts-ignore
		_isoCommit: ({ author: overrideAuthor, message }) =>
			isoGit.commit({
				fs: withProxy({
					nodeishFs: rawFs,
					verbose: debug,
					description: "iso commit",
				}),
				dir,
				cache,
				author: overrideAuthor || author,
				message: message,
			}),

		nodeishFs,

		...(experimentalFeatures.lixFs
			? {
					read(path: string) {
						return nodeishFs.readFile(path, { encoding: "utf-8" })
					},
					write(path: string, content: string) {
						return nodeishFs.writeFile(path, content)
					},
					listDir(path: string) {
						return nodeishFs.readdir(path)
					},
			  }
			: {}),

		/**
		 * Gets the git origin url of the current repository.
		 *
		 * @returns The git origin url or undefined if it could not be found.
		 */
		async listRemotes() {
			try {
				const withProxypedFS = withProxy({
					nodeishFs: rawFs,
					verbose: debug,
					description: "listRemotes",
					intercept: delayedAction,
				})

				const remotes = await isoGit.listRemotes({
					fs: withProxypedFS,
					dir,
				})

				return remotes
			} catch (_err) {
				return undefined
			}
		},

		async checkout({ branch }: { branch: string }) {
			branchName = branch

			if (lazyFS) {
				throw new Error(
					"not implemented for lazy lix mode yet, use openRepo with different branch instead"
				)
			}

			await checkout({
				fs: withProxy({
					nodeishFs: rawFs,
					verbose: debug,
					description: "checkout",
				}),
				cache,
				dir,
				ref: branchName,
			})
		},

		status,

		statusList,

		async forkStatus() {
			if (!gitUrl) {
				throw new Error(
					"Could not find repo url, only github supported for forkStatus at the moment"
				)
			}
			// uncomment to disable: return { ahead: 0, behind: 0, conflicts: false }
			const repo = await this

			const { isFork, parent } = (await repo.getMeta()) as {
				isFork: boolean
				parent: { url: string }
			}

			if (!isFork) {
				return { error: "could not get fork upstream or repo not a fork" }
			}

			const forkFs = withProxy({
				nodeishFs: rawFs,
				verbose: debug,
				description: "forkStatus",
				intercept: delayedAction,
			})

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

			const res: Promise<
				| Awaited<
						ReturnType<typeof github.request<"GET /repos/{owner}/{repo}/compare/{base}...{head}">>
				  >
				| { error: any }
			> = github
				.request("GET /repos/{owner}/{repo}/compare/{base}...{head}", {
					owner,
					repo: repoName,
					base: currentUpstreamCommit,
					head: currentOriginCommit,
				})
				.catch((newError: Error) => {
					setErrors((previous: any) => [...(previous || []), newError])
					return { error: newError }
				})

			const compare = await res

			if ("error" in compare || !("data" in compare)) {
				return { error: compare.error || "could not diff repos on github" }
			}

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
			return { ahead: compare.data.ahead_by, behind: compare.data.behind_by, conflicts }
		},

		async commit({
			author: overrideAuthor,
			message,
			include,
		}: // TODO: exclude,
		{
			author?: any
			message: string
			include: string[]
			// exclude: string[]
		}) {
			if (include) {
				const additions: string[] = []
				const deletions: string[] = []

				for (const entry of include) {
					if (await rawFs.lstat(entry).catch(() => undefined)) {
						additions.push(entry)
					} else {
						deletions.push(entry)
					}
				}

				additions.length && (await add(additions))
				deletions.length && (await Promise.all(deletions.map((del) => remove(del))))
			} else {
				// TODO: commit all
			}

			const commitArgs = {
				fs: withProxy({
					nodeishFs: rawFs,
					verbose: debug,
					description: "commit",
					intercept: delayedAction,
				}),
				dir,
				cache,
				author: overrideAuthor || author,
				message: message,
			}

			if (experimentalFeatures.lixCommit) {
				console.warn("using experimental commit for this repo.")
				return lixCommit(commitArgs)
			} else {
				return isoGit.commit(commitArgs)
			}
		},

		push() {
			if (!gitUrl) {
				throw new Error("Could not find repo url, only github supported for push at the moment")
			}
			return isoGit.push({
				fs: withProxy({
					nodeishFs: rawFs,
					verbose: debug,
					description: "push",
					intercept: delayedAction,
				}),
				url: gitUrl,
				cache,
				corsProxy: gitProxyUrl,
				http: makeHttpClient({ debug, description: "push" }),
				dir,
			})
		},

		async pull(cmdArgs) {
			if (!gitUrl) {
				throw new Error("Could not find repo url, only github supported for pull at the moment")
			}
			const pullFs = withProxy({
				nodeishFs: rawFs,
				verbose: debug,
				description: "pull",
				intercept: delayedAction,
			})

			const { fetchHead, fetchHeadDescription } = await isoGit.fetch({
				depth: 5, // TODO: how to handle depth with upstream? reuse logic from fork sync
				fs: pullFs,
				cache,
				http: makeHttpClient({ verbose: debug, description: "pull" }),
				corsProxy: gitProxyUrl,
				ref: branchName,
				tags: false,
				dir,
				url: gitUrl,
				// remote: "origin",
				// remoteRef,
				singleBranch: cmdArgs?.singleBranch || true,
			})

			if (!fetchHead) {
				throw new Error("could not fetch head")
			}

			await isoGit.merge({
				fs: pullFs,
				cache,
				dir,
				ours: branchName,
				theirs: fetchHead,
				fastForward: cmdArgs?.fastForward,
				message: `Merge ${fetchHeadDescription}`,
				author: cmdArgs?.author || author,
				dryRun: false,
				noUpdateBranch: false,
				// committer,
				// signingKey,
				// fastForwardOnly,
			})

			if (experimentalFeatures.lazyClone) {
				console.warn(
					"enableExperimentalFeatures.lazyClone is set for this repo but pull not fully implemented. disabling lazy files"
				)

				await emptyWorkdir()

				// remember we are now leaving lazy mode
				experimentalFeatures.lazyClone = false

				true && console.info('checking out "HEAD" after pull')
				await checkout({
					fs: rawFs,
					cache,
					dir,
					ref: branchName,
					noCheckout: false,
				})
			} else {
				await checkout({
					fs: rawFs,
					cache,
					dir,
					ref: branchName,
					noCheckout: false,
				})
			}
		},

		// experimental - it uses delayed actions
		log(cmdArgs = {}) {
			return isoGit.log({
				fs: withProxy({
					nodeishFs: rawFs,
					verbose: debug,
					description: "log",
					intercept: delayedAction,
				}),
				depth: cmdArgs.depth,
				filepath: cmdArgs.filepath,
				dir,
				ref: cmdArgs.ref,
				cache,
				since: cmdArgs.since,
			})
		},

		async mergeUpstream(cmdArgs) {
			if (!gitUrl) {
				throw new Error(
					"Could not find repo url, only github supported for mergeUpstream at the moment"
				)
			}
			const branch =
				cmdArgs?.branch ||
				(await isoGit.currentBranch({
					fs: withProxy({
						nodeishFs: rawFs,
						verbose: debug,
						description: "mergeUpstream",
						intercept: delayedAction,
					}),
					dir,
					fullname: false,
				}))
			if (typeof branch !== "string") {
				throw "could not get current branch"
			}

			let response
			try {
				response = await github.request("POST /repos/{owner}/{repo}/merge-upstream", {
					branch,
					owner,
					repo: repoName,
				})
			} catch (error) {
				return { error }
			}

			return response?.data
		},

		async createFork() {
			return github.rest.repos.createFork({
				owner,
				repo: repoName,
			})
		},

		/**
		 * Parses the origin from remotes.
		 *
		 * The function ensures that the same orgin is always returned for the same repository.
		 */
		async getOrigin(): Promise<string | undefined> {
			// TODO: this flow is obsolete and can be unified with the initialization of the repo
			const repo = await this
			const remotes: Array<{ remote: string; url: string }> | undefined = await repo.listRemotes()

			const origin = remotes?.find((elements) => elements.remote === "origin")
			if (origin === undefined) {
				return undefined
			}
			// polyfill for some editor related origin issues
			let result = origin.url
			if (result.endsWith(".git") === false) {
				result += ".git"
			}

			return transformRemote(result)
		},

		async getCurrentBranch() {
			// TODO: make stateless?
			return (
				(await isoGit.currentBranch({
					fs: withProxy({
						nodeishFs: rawFs,
						verbose: debug,
						description: "getCurrentBranch",
						intercept: delayedAction,
					}),
					dir,
				})) || undefined
			)
		},

		async getBranches() {
			if (!gitUrl) {
				throw new Error(
					"Could not find repo url, only github supported for getBranches at the moment"
				)
			}
			const serverRefs = await isoGit
				.listServerRefs({
					url: gitUrl,
					corsProxy: gitProxyUrl,
					prefix: "refs/heads",
					http: makeHttpClient({ verbose: debug, description: "getBranches" }),
				})
				.catch((error) => {
					return { error }
				})

			if ("error" in serverRefs) {
				return undefined
			}

			return (
				serverRefs
					.filter((ref) => !ref.ref.startsWith("refs/heads/gh-readonly-queue/"))
					.map((ref) => ref.ref.replace("refs/heads/", "")) || undefined
			)
		},

		errors: Object.assign(errors, {
			subscribe: (callback: (value: LixError[]) => void) => {
				createEffect(() => {
					// TODO: the subscription should not send the whole array but jsut the new errors
					// const maybeLastError = errors().at(-1)
					const allErrors = errors()
					if (allErrors.length) {
						callback(allErrors)
					}
				})
			},
		}),

		async getFirstCommitHash() {
			const getFirstCommitFs = withProxy({
				nodeishFs: rawFs,
				verbose: debug,
				description: "getFirstCommitHash",
				intercept: delayedAction,
			})

			if (lazyFS) {
				try {
					await isoGit.fetch({
						singleBranch: true,
						dir,
						depth: 2147483647, // the magic number for all commits
						http: makeHttpClient({ verbose: debug, description: "getFirstCommitHash" }),
						corsProxy: gitProxyUrl,
						fs: getFirstCommitFs,
					})
				} catch {
					return undefined
				}
			}

			let firstCommitHash: string | undefined = "HEAD"
			for (;;) {
				const commits: Awaited<ReturnType<typeof isoGit.log>> | { error: any } = await isoGit
					.log({
						fs: getFirstCommitFs,
						depth: 550,
						dir,
						ref: firstCommitHash,
					})
					.catch((error: any) => {
						return { error }
					})

				if ("error" in commits) {
					firstCommitHash = undefined
					break
				}

				const lastHashInPage: undefined | string = commits.at(-1)?.oid
				if (lastHashInPage) {
					firstCommitHash = lastHashInPage
				}

				if (commits.length < 550) {
					break
				}
			}

			return firstCommitHash
		},

		/**
		 * Additional information about a repository provided by GitHub.
		 */
		async getMeta() {
			if (!gitUrl) {
				throw new Error("Could not find repo url, only github supported for getMeta at the moment")
			}
			const res: Awaited<
				ReturnType<typeof github.request<"GET /repos/{owner}/{repo}">> | { error: Error }
			> = await github
				.request("GET /repos/{owner}/{repo}", {
					owner,
					repo: repoName,
				})
				.catch((newError: Error) => {
					setErrors((previous: any) => [...(previous || []), newError])
					return { error: newError }
				})

			if ("error" in res) {
				return { error: res.error }
			} else {
				return {
					name: res.data.name,
					isPrivate: res.data.private,
					isFork: res.data.fork,
					permissions: {
						admin: res.data.permissions?.admin || false,
						push: res.data.permissions?.push || false,
						pull: res.data.permissions?.pull || false,
					},
					owner: {
						name: res.data.owner.name || undefined,
						email: res.data.owner.email || undefined,
						login: res.data.owner.login,
					},
					parent: res.data.parent
						? {
								url: transformRemote(res.data.parent.git_url),
								fullName: res.data.parent.full_name,
						  }
						: undefined,
				}
			}
		},
	}
}
