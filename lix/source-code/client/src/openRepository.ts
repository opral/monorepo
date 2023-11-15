import type { NodeishFilesystem } from "@lix-js/fs"
import type { Repository, LixError } from "./api.js"
import { transformRemote, parseLixUri } from "./helpers.js"
import { httpWithLazyInjection } from "./helpers/httpWithLazyInjection.js"

// @ts-ignore
import http from "./isomorphic-git-forks/http-client.js"
import { Octokit } from "octokit"

import { createSignal, createEffect } from "./solid.js"
import {
	clone,
	listRemotes,
	status,
	statusMatrix,
	push,
	pull,
	commit,
	currentBranch,
	add,
	walk,
	log,
	TREE,
	WORKDIR,
	STAGE,
	listFiles,
	listServerRefs,
	writeTree,
	fetch as isoFetch,
	merge,
	checkout,

	// listBranches,
} from "isomorphic-git"
import { withLazyFetching } from "./helpers/withLazyFetching.js"
// import { flatFileListToDirectoryStructure } from "./isomorphic-git-forks/flatFileListToDirectoryStructure.js"

export async function openRepository(
	url: string,
	args: {
		nodeishFs: NodeishFilesystem
		workingDirectory?: string
		branch?: string
		auth?: unknown // unimplemented
	}
): Promise<Repository> {
	const rawFs = args.nodeishFs

	const [errors, setErrors] = createSignal<Error[]>([])

	// the url format for lix urls is
	// https://lix.inlang.com/git/github.com/inlang/monorepo
	// proto:// lixServer / namespace / repoHost / owner / repoName
	// namespace is ignored until switching from git.inlang.com to lix.inlang.com and can eveolve in future to be used for repoType, api type or feature group
	// the url format for direct github urls without a lix server is https://github.com/inlang/examplX (only per domain-enabled git hosters will be supported, currently just gitub)
	// the url for opening a local repo allready in the fs provider is file://path/to/repo (not implemented yet)

	const { protocol, lixHost, repoHost, owner, repoName } = parseLixUri(url)

	const gitProxyUrl = lixHost ? `${protocol}//${lixHost}/git-proxy/` : ""
	const gitHubProxyUrl = lixHost ? `${protocol}//${lixHost}/github-proxy/` : ""

	const github = new Octokit({
		request: {
			fetch: (...ghArgs: any) => {
				ghArgs[0] = gitHubProxyUrl + ghArgs[0]
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
	const gitUrl = `https://${repoHost}/${owner}/${repoName}`

	// the directory we use for all git operations
	const dir = "/"

	let pending: Promise<void | { error: Error }> | undefined = clone({
		fs: rawFs, // withLazyFetching(rawFs, "clone"),
		// to start the repo lazy - we add the blob:none filter here
		http: httpWithLazyInjection(http, {
			noneBlobFilter: true,
			filterRefList: { ref: args.branch },
			overrideHaves: undefined,
			overrideWants: undefined,
		}),
		dir,
		corsProxy: gitProxyUrl,
		url: gitUrl,
		noCheckout: true,
		singleBranch: true,
		ref: args.branch,
		depth: 1,
		noTags: true,
	})
		.finally(() => {
			pending = undefined
		})
		.catch((newError: Error) => {
			setErrors((previous) => [...(previous || []), newError])
		})

	await pending

	const oidToFilePaths = {} as { [oid: string]: string[] }
	const filePathToOid = {} as { [filePath: string]: string }

	// TODO - lazy fetch use path.join
	const gitdir = dir.endsWith("/") ? dir + ".git" : dir + "/.git"
	// TODO - lazy fetch what shall we use as ref?
	const ref = "main"

	await walk({
		fs: rawFs,
		// cache
		dir,
		gitdir,
		trees: [TREE({ ref })],
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		map: async function (fullpath, [commit]) {
			if (fullpath === ".") return

			const oId = await commit?.oid()
			if (oId === undefined) {
				return
			}

			filePathToOid[fullpath] = oId
			if (oidToFilePaths[oId] === undefined) {
				oidToFilePaths[oId] = [] as string[]
			}
			oidToFilePaths[oId]?.push(fullpath)
		},
	})
	// delay all fs and repo operations until the repo clone and checkout have finished, this is preparation for the lazy feature

	return {
		nodeishFs: withLazyFetching(
			rawFs,
			dir,
			gitdir,
			ref,
			filePathToOid,
			oidToFilePaths,
			http,
			"nodishfs"
		),

		/**
		 * Gets the git origin url of the current repository.
		 *
		 * @returns The git origin url or undefined if it could not be found.
		 */
		async listRemotes() {
			try {
				const withLazyFetchingpedFS = withLazyFetching(
					rawFs,
					dir,
					gitdir,
					ref,
					filePathToOid,
					oidToFilePaths,
					http,
					"listRemotes"
				)

				const remotes = await listRemotes({
					fs: withLazyFetchingpedFS,
					dir,
				})

				return remotes
			} catch (_err) {
				return undefined
			}
		},

		status(cmdArgs) {
			return status({
				fs: withLazyFetching(
					rawFs,
					dir,
					gitdir,
					ref,
					filePathToOid,
					oidToFilePaths,
					http,
					"status"
				),
				dir,
				filepath: cmdArgs.filepath,
			})
		},

		statusMatrix(cmdArgs) {
			// TODO #1459 where is the type of cmdArgs defined?
			if ((cmdArgs as any).filepaths !== undefined) {
				throw new Error(
					"Lazy fetching doesn't support filepaths for now - it will only create a matrix of fetched files for now"
				)
			}

			return (async (cmdArgs) => {
				// we pass only the lazy loaded files to the status matrix
				const filepaths = await listFiles({
					fs: rawFs,
					gitdir: gitdir,
					// TODO #1459 investigate the index cache further seem to be an in memory forwared on write cache to allow fast reads of the index...
					dir: dir,
					// NOTE: no ref config! we don't set ref because we want the list of files on the index
				})

				return statusMatrix({
					fs: withLazyFetching(
						rawFs,
						dir,
						gitdir,
						ref,
						filePathToOid,
						oidToFilePaths,
						http,
						"statusMatrix"
					),
					dir,
					filepaths,
					filter: cmdArgs.filter,
				})
			})(cmdArgs)
		},

		add(cmdArgs) {
			return add({
				fs: withLazyFetching(rawFs, dir, gitdir, ref, filePathToOid, oidToFilePaths, http, "add"),
				dir,
				filepath: cmdArgs.filepath,
			})
		},

		commit(cmdArgs) {
			return (async (cmdArgs) => {
				
				// TODO #1459 use central helper function
				function normalPath(path: string): string {
					const dots = /(\/|^)(\.\/)+/g
					const slashes = /\/+/g

					const upreference = /(?<!\.\.)[^/]+\/\.\.\//

					// Append '/' to the beginning and end
					path = `/${path}/`

					// Handle the edge case where a path begins with '/..'
					path = path.replace(/^\/\.\./, "")

					// Remove extraneous '.' and '/'
					path = path.replace(dots, "/").replace(slashes, "/")

					// Resolve relative paths if they exist
					let match
					while ((match = path.match(upreference)?.[0])) {
						path = path.replace(match, "")
					}

					return path
				}

				// TODO #1459 use central helper function
				function getDirname(path: string): string {
					return normalPath(
						path
							.split("/")
							.filter((x) => x)
							.slice(0, -1)
							.join("/") ?? path
					)
				}
				// TODO #1459 use central helper function
				function getBasename(path: string): string {
					return (
						path
							.split("/")
							.filter((x) => x)
							.at(-1) ?? path
					)
				}

				const fileStates = {} as {
					[parentFolder: string]: {
						mode: string
						path: string
						type: "blob" | "tree" | "commit" | "special"
						oid: string | undefined
					}[]
				}

				async function createTree(
					currentFolder: string,
					fileStates: {
						[parentFolder: string]: {
							mode: string
							path: string
							type: "blob" | "tree" | "commit" | "special"
							oid: string | undefined
						}[]
					}
				): Promise<string> {
					const entries = [] as {
						mode: string
						path: string
						type: "blob" | "tree" | "commit"
						oid: string
					}[]

					for (const entry of fileStates[currentFolder]!) {
						const oid =
							entry.type === 'tree' ? (await createTree(currentFolder + entry.path + "/", fileStates)) : entry.oid!;

						entries.push({
							mode: !entry.oid && entry.type === "tree" ? "040000" : entry.mode,
							path: entry.path,
							type: entry.type as "blob" | "tree" | "commit", // TODO #1459 we cast here to remove special - check cases
							oid,
						})
					}

					console.log("writing tree for " + currentFolder)
					return await writeTree({ fs: rawFs, dir, gitdir, tree: entries })
				}

				await walk({
					fs: rawFs,
					// cache
					dir,
					gitdir,
					trees: [TREE({ ref }), WORKDIR(), STAGE()],
					// eslint-disable-next-line @typescript-eslint/no-unused-vars
					map: async function (fullpath, [refState, _workdir, stagingState]) {
						if ((!refState && !stagingState) || fullpath === ".") {
							// skip unmanaged files (not indexed nor in ref) and skip root
							return
						}

						if (fullpath === ".") {
							// skip root folder
							return 
						}

						const fileDir = getDirname(fullpath)
						if (fileStates[fileDir] === undefined) {
							fileStates[fileDir] = []
						}

						if (!stagingState && refState) {
							// file was not checked out - open question how do we distinguis it from deleted?
							fileStates[fileDir]?.push({
								mode: (await refState.mode()).toString(8),
								path: getBasename(fullpath),
								type: await refState.type(),
								oid: await refState.oid(),
							})
							return
						}

						if (stagingState && !refState) {
							// file does not exist in ref - it was added

							fileStates[fileDir]?.push({
								mode: (await stagingState.mode()).toString(8),
								path: getBasename(fullpath),
								type: await stagingState.type(),
								oid: await stagingState.oid(),
							})

							return
						}

						if (stagingState && refState) {
							// file does exists in both
							const stagingMode = await stagingState.mode()

							fileStates[fileDir]?.push({
								mode: stagingMode ? stagingMode.toString(8) : "040000",
								path: getBasename(fullpath),
								type: await stagingState!.type(),
								oid: await stagingState!.oid(),
							})

							return
						}
					},
					reduce: async function (parent, children) {},
				})

				const tree = await createTree("/", fileStates)
				console.log(tree)

				return commit({
					fs: withLazyFetching(
						rawFs,
						dir,
						gitdir,
						ref,
						filePathToOid,
						oidToFilePaths,
						http,
						"commit"
					),
					dir,
					author: cmdArgs.author,
					message: cmdArgs.message,
					tree,
				})
			})(cmdArgs)
		},

		push() {
			// TODO #1459 fetch head from remote

			return push({
				fs: withLazyFetching(rawFs, dir, gitdir, ref, filePathToOid, oidToFilePaths, http, "push"),
				url: gitUrl,
				corsProxy: gitProxyUrl,
				http /*: httpWithLazyInjection(http, {
					noneBlobFilter: true,
					filterRefList: { ref: args.branch },
					overrideHaves: undefined,
					overrideWants: undefined,
				}),*/,
				dir,
			})
		},

		// stage ->
		// commit -> brings the
		// pull
		// push

		async pull(cmdArgs) {
			// if (!args.ref) {
			const head = await currentBranch({ fs: rawFs, gitdir })
			// TODO: use a better error.
			if (!head) {
				throw new Error(" MissingParameterError ref")
			}
			const ref = head
			// }

			const { fetchHead, fetchHeadDescription } = await isoFetch({
				fs: rawFs,
				// cache,
				http: httpWithLazyInjection(http, {
					noneBlobFilter: true,
					filterRefList: { ref: args.branch },
					overrideHaves: undefined,
					overrideWants: undefined,
				}),
				// onProgress,
				// onMessage,
				// onAuth,
				// onAuthSuccess,
				// onAuthFailure,
				gitdir,
				corsProxy: gitProxyUrl,
				ref,
				url: gitUrl,
				// remote,
				// remoteRef,
				singleBranch: true,
				// headers,
				// prune,
				// pruneTags,
			})
			await merge({
				// NOTE when a blob is needed during merge (changed on the client AND on theserver - oid is not sufficient) we utilize lazy fetching again
				fs: withLazyFetching(
					rawFs,
					dir,
					gitdir,
					ref,
					filePathToOid,
					oidToFilePaths,
					http,
					"pull-merge"
				),
				// cache,
				gitdir,
				ours: ref,
				theirs: fetchHead!, // seem to be not checked in orginal isomorphic git pull
				fastForward: cmdArgs.fastForward,
				// fastForwardOnly,
				message: `Merge ${fetchHeadDescription}`,
				author: cmdArgs.author,
				// committer,
				// signingKey,
				dryRun: false,
				noUpdateBranch: false,
			})

			const files: string[] = []

			await walk({
				fs: withLazyFetching(
					rawFs,
					dir,
					gitdir,
					ref,
					filePathToOid,
					oidToFilePaths,
					http,
					"pull-merge"
				),
				// cache
				dir,
				gitdir,
				trees: [STAGE()],
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				map: async function (fullpath, [commit]) {
					if (commit && (await commit.type()) === "blob") {
						files.push(fullpath)
					}
				},
			})

			await checkout({
				dir: dir,
				gitdir: gitdir,
				fs: withLazyFetching(
					rawFs,
					dir,
					gitdir,
					ref,
					filePathToOid,
					oidToFilePaths,
					http,
					"pull-merge"
				),
				filepaths: files,
				ref: ref,
			})

			for (const file of files) {
				console.log(await rawFs.readFile(file, { encoding: "utf-8" }))
			}

			// TODO #1459 add checkout see https://github.com/isomorphic-git/isomorphic-git/blob/d7f24f8041e18a44ccf72b7feb7a951337fa1149/src/commands/pull.js#L120

			/*return pull({
				fs: withLazyFetching(rawFs, dir, gitdir, ref, filePathToOid, oidToFilePaths, http, "pull"),
				url: gitUrl,
				corsProxy: gitProxyUrl,
				http,
				dir,
				fastForward: cmdArgs.fastForward,
				singleBranch: cmdArgs.singleBranch,
				author: cmdArgs.author,
			})*/
		},

		log(cmdArgs) {
			return log({
				fs: withLazyFetching(rawFs, dir, gitdir, ref, filePathToOid, oidToFilePaths, http, "log"),
				depth: cmdArgs?.depth,
				dir,
				since: cmdArgs?.since,
			})
		},

		async mergeUpstream(cmdArgs) {
			let response
			try {
				response = await github.request("POST /repos/{owner}/{repo}/merge-upstream", {
					branch: cmdArgs.branch,
					owner,
					repo: repoName,
				})
			} catch (_err) {
				/* ignore */
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
		async getOrigin(): Promise<string> {
			const repo = await this
			const remotes: Array<{ remote: string; url: string }> | undefined = await repo.listRemotes()

			const origin = remotes?.find((elements) => elements.remote === "origin")
			if (origin === undefined) {
				return "unknown"
			}
			// polyfill for some editor related origin issues
			let result = origin.url
			if (result.endsWith(".git") === false) {
				result += ".git"
			}

			return transformRemote(result)
		},

		async getCurrentBranch() {
			// TODO: make stateless
			return (
				(await currentBranch({
					fs: rawFs,
					dir,
				})) || undefined
			)
		},

		async getBranches() {
			return (
				(
					await listServerRefs({
						url: gitUrl,
						corsProxy: gitProxyUrl,
						prefix: "refs/heads",
						http,
					})
				).map((ref) => ref.ref.replace("refs/heads/", "")) || undefined
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

		/**
		 * Additional information about a repository provided by GitHub.
		 */
		async getMeta() {
			const res: Awaited<
				ReturnType<typeof github.request<"GET /repos/{owner}/{repo}">> | { error: Error }
			> = await github
				.request("GET /repos/{owner}/{repo}", {
					owner,
					repo: repoName,
				})
				.catch((newError: Error) => {
					setErrors((previous) => [...(previous || []), newError])
					return { error: newError }
				})

			if ("error" in res) {
				return { error: res.error }
			}

			const {
				data: { name, private: isPrivate, fork: isFork, parent, owner: ownerMetaData, permissions },
			} = res
			return {
				name,
				isPrivate,
				isFork,
				permissions: {
					admin: permissions?.admin || false,
					push: permissions?.push || false,
					pull: permissions?.pull || false,
				},
				owner: {
					name: ownerMetaData.name || undefined,
					email: ownerMetaData.email || undefined,
					login: ownerMetaData.login,
				},
				parent: parent
					? {
							url: transformRemote(parent.git_url),
							fullName: parent.full_name,
					  }
					: undefined,
			}
		},
	}
}
