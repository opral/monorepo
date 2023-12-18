import type { NodeishFilesystem } from "@lix-js/fs"
import type { Repository, LixError } from "./api.js"
import { transformRemote, withLazyFetching, parseLixUri } from "./helpers.js"
// @ts-ignore
import { makeHttpClient } from "./git-http/client.js"
import { optimizedRefsRes, optimizedRefsReq } from "./git-http/optimize-refs.js"
import { Octokit } from "octokit"

import { createSignal, createEffect } from "./solid.js"

import { commit as lixCommit } from "./git/commit.js"
import isoGit from "isomorphic-git"
const {
	clone,
	listRemotes,
	status,
	statusMatrix,
	push,
	pull,
	currentBranch,
	add,
	log,
	listServerRefs,
	checkout,
	addRemote,
	fetch: gitFetch,
	commit: isoCommit,
} = isoGit

const verbose = false

// TODO addd tests for whitelist

const whitelistedExperimentalRepos = [
	"inlang/example",
	"inlang/ci-test-repo",
	"inlang/monorepo",
	"inlang/example-test",

	"janfjohannes/inlang-example",
	"janfjohannes/cal.com",

	"niklasbuchfink/appflowy",
]

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

	const enableExperimentalFeatures = whitelistedExperimentalRepos.includes(
		`${owner}/${repoName}`.toLocaleLowerCase()
	)

	if (enableExperimentalFeatures) {
		console.warn("using experimental git features for this repo.")
	}

	// Bail commit/ push on errors that are relevant or unknown

	// the directory we use for all git operations
	const dir = "/"

	let pending: Promise<void | { error: Error }> | undefined
	// Simpel check for existing git repos
	// TODO: check for same origin
	const maybeGitDir = await rawFs.lstat("/.git").catch((error) => ({ error }))
	if ("error" in maybeGitDir) {
		pending = clone({
			fs: withLazyFetching({ nodeishFs: rawFs, verbose, description: "clone" }),
			http: makeHttpClient({
				verbose,
				description: "clone",

				onReq: ({ url, body }: { url: string; body: any }) => {
					return optimizedRefsReq({ url, body, addRef: args.branch })
				},

				onRes: optimizedRefsRes,
			}),
			dir,
			corsProxy: gitProxyUrl,
			url: gitUrl,
			singleBranch: true,
			noCheckout: true,
			ref: args.branch,
			depth: 1,
			noTags: true,
		})
			.then(() => {
				return checkout({
					fs: withLazyFetching({
						nodeishFs: rawFs,
						verbose,
						description: "checkout",
					}),
					dir,
					ref: args.branch,
					// filepaths: ["resources/en.json", "resources/de.json", "project.inlang.json"],
				})
			})
			.finally(() => {
				pending = undefined
			})
			.catch((newError: Error) => {
				setErrors((previous) => [...(previous || []), newError])
			})

		await pending
	}

	// delay all fs and repo operations until the repo clone and checkout have finished, this is preparation for the lazy feature
	function delayedAction({ execute }: { execute: () => any }) {
		if (pending) {
			return pending.then(execute)
		}

		return execute()
	}

	return {
		_isoGit: isoGit,
		_enableExperimentalFeatures: enableExperimentalFeatures,
		nodeishFs: withLazyFetching({
			nodeishFs: rawFs,
			verbose,
			description: "app",
			intercept: delayedAction,
		}),

		/**
		 * Gets the git origin url of the current repository.
		 *
		 * @returns The git origin url or undefined if it could not be found.
		 */
		async listRemotes() {
			try {
				const withLazyFetchingpedFS = withLazyFetching({
					nodeishFs: rawFs,
					verbose,
					description: "listRemotes",
					intercept: delayedAction,
				})

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
				fs: withLazyFetching({
					nodeishFs: rawFs,
					verbose,
					description: "status",
					intercept: delayedAction,
				}),
				dir,
				filepath: cmdArgs.filepath,
			})
		},

		async forkStatus() {
			const repo = await this

			const { isFork, parent } = (await repo.getMeta()) as {
				isFork: boolean
				parent: { url: string }
			}

			if (!isFork) {
				return { error: "could not get fork origin or repo not a fork" }
			}
			const forkFs = withLazyFetching({
				nodeishFs: rawFs,
				verbose,
				description: "forkStatus",
				intercept: delayedAction,
			})

			await addRemote({
				dir,
				remote: "upstream",
				url: "https://" + parent.url,
				fs: forkFs,
			})

			try {
				await gitFetch({
					depth: 1,
					singleBranch: true,
					dir,
					ref: args.branch,
					remote: "upstream",
					http: makeHttpClient({ verbose, description: "forkStatus" }),
					fs: forkFs,
				})
			} catch (err) {
				return { error: err }
			}

			const branch = await isoGit.currentBranch({
				fs: forkFs,
				dir,
				fullname: false,
			})

			if (typeof branch !== "string") {
				return { error: "could not get current branch" }
			}

			const currentUpstreamCommit = await isoGit.resolveRef({
				fs: forkFs,
				dir: "/",
				ref: "upstream/" + branch,
			})

			const currentOriginCommit = await isoGit.resolveRef({
				fs: forkFs,
				dir: "/",
				ref: branch,
			})

			if (currentUpstreamCommit === currentOriginCommit) {
				return { ahead: 0, behind: 0 }
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
					setErrors((previous) => [...(previous || []), newError])
					return { error: newError }
				})

			const compare = await res

			if ("error" in compare || !("data" in compare)) {
				return { error: compare.error || "could not diff repos on github" }
			}

			return { ahead: compare.data.ahead_by, behind: compare.data.behind_by }
		},

		statusMatrix(cmdArgs) {
			return statusMatrix({
				fs: withLazyFetching({
					nodeishFs: rawFs,
					verbose,
					description: "statusMatrix",
					intercept: delayedAction,
				}),
				dir,
				filter: cmdArgs.filter,
			})
		},

		add(cmdArgs) {
			return add({
				fs: withLazyFetching({
					nodeishFs: rawFs,
					verbose,
					description: "add",
					intercept: delayedAction,
				}),
				dir,
				filepath: cmdArgs.filepath,
			})
		},

		commit(cmdArgs) {
			const commitArgs = {
				fs: withLazyFetching({
					nodeishFs: rawFs,
					verbose,
					description: "commit",
					intercept: delayedAction,
				}),
				dir,
				ref: args.branch,
				author: cmdArgs.author,
				message: cmdArgs.message,
			}
			if (enableExperimentalFeatures) {
				console.warn("using experimental commit for this repo.")
				return lixCommit(commitArgs)
			} else {
				return isoCommit(commitArgs)
			}
		},

		push() {
			return push({
				fs: withLazyFetching({
					nodeishFs: rawFs,
					verbose,
					description: "push",
					intercept: delayedAction,
				}),
				url: gitUrl,
				corsProxy: gitProxyUrl,
				http: makeHttpClient({ verbose, description: "push" }),
				dir,
			})
		},

		pull(cmdArgs) {
			return pull({
				fs: withLazyFetching({
					nodeishFs: rawFs,
					verbose,
					description: "pull",
					intercept: delayedAction,
				}),
				url: gitUrl,
				corsProxy: gitProxyUrl,
				http: makeHttpClient({ verbose, description: "pull" }),
				dir,
				fastForward: cmdArgs.fastForward,
				singleBranch: cmdArgs.singleBranch,
				author: cmdArgs.author,
			})
		},

		log(cmdArgs) {
			return log({
				fs: withLazyFetching({
					nodeishFs: rawFs,
					verbose,
					description: "log",
					intercept: delayedAction,
				}),
				depth: cmdArgs?.depth,
				dir,
				since: cmdArgs?.since,
			})
		},

		async mergeUpstream(cmdArgs) {
			const branch =
				cmdArgs?.branch ||
				(await isoGit.currentBranch({
					fs: withLazyFetching({
						nodeishFs: rawFs,
						verbose,
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
					fs: withLazyFetching({
						nodeishFs: rawFs,
						verbose,
						description: "getCurrentBranch",
						intercept: delayedAction,
					}),
					dir,
				})) || undefined
			)
		},

		async getBranches() {
			const serverRefs = await listServerRefs({
				url: gitUrl,
				corsProxy: gitProxyUrl,
				prefix: "refs/heads",
				http: makeHttpClient({ verbose, description: "getBranches" }),
			}).catch((error) => {
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
				data: {
					id: githubId,
					name,
					private: isPrivate,
					fork: isFork,
					parent,
					owner: ownerMetaData,
					permissions,
				},
			} = res

			const idDigest = await crypto.subtle.digest(
				"SHA-256",
				new TextEncoder().encode(`${githubId}`)
			)
			const id = [...new Uint8Array(idDigest)]
				.map((b) => ("00" + b.toString(16)).slice(-2))
				.join("")

			return {
				id,
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
