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
	// fetch,
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
		trees: [TREE({ ref }), WORKDIR(), STAGE()],
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		map: async function (fullpath, [commit, _workdir, _stage]) {
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
				// TODO #1459 WIP start to implement a tree extraction
				// we pass only the lazy loaded files to the status matrix
				/*
				const filepaths = await listFiles({
					fs: rawFs,
					gitdir: gitdir,
					// TODO #1459 investigate the index cache further seem to be an in memory forwared on write cache to allow fast reads of the index...
					dir: dir,
					// NOTE: no ref config! we don't set ref because we want the list of files on the index
				});

				GitIndexManager.acquire({ fs: rawFs, gitdir }, async function(
					index
				  ) {
					return index.entries.map(x => x.path)
				  })

				const flattFileList = flatFileListToDirectoryStructure(filepaths);

*/

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
				})
			})(cmdArgs)
		},

		push() {
			return push({
				fs: withLazyFetching(rawFs, dir, gitdir, ref, filePathToOid, oidToFilePaths, http, "push"),
				url: gitUrl,
				corsProxy: gitProxyUrl,
				http,
				dir,
			})
		},

		pull(cmdArgs) {
			return pull({
				fs: withLazyFetching(rawFs, dir, gitdir, ref, filePathToOid, oidToFilePaths, http, "pull"),
				url: gitUrl,
				corsProxy: gitProxyUrl,
				http,
				dir,
				fastForward: cmdArgs.fastForward,
				singleBranch: cmdArgs.singleBranch,
				author: cmdArgs.author,
			})
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
