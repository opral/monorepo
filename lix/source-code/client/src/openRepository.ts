import type { NodeishFilesystem } from "@lix-js/fs"
import type { Repository, LixError } from "./api.js"
import { transformRemote, withLazyFetching, parseLixUri } from "./helpers.js"
// @ts-ignore
import http from "./http-client.js"
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
	log,
	listServerRefs,
	// fetch,
	// listBranches,
} from "isomorphic-git"

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
		fs: withLazyFetching(rawFs, "clone"),
		http,
		dir,
		corsProxy: gitProxyUrl,
		url: gitUrl,
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

	// delay all fs and repo operations until the repo clone and checkout have finished, this is preparation for the lazy feature
	function delayedAction({ execute }: { execute: () => any }) {
		if (pending) {
			return pending.then(execute)
		}

		return execute()
	}

	return {
		nodeishFs: withLazyFetching(rawFs, "app", delayedAction),

		/**
		 * Gets the git origin url of the current repository.
		 *
		 * @returns The git origin url or undefined if it could not be found.
		 */
		async listRemotes() {
			try {
				const withLazyFetchingpedFS = withLazyFetching(rawFs, "listRemotes", delayedAction)

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
				fs: withLazyFetching(rawFs, "statusMatrix", delayedAction),
				dir,
				filepath: cmdArgs.filepath,
			})
		},

		statusMatrix(cmdArgs) {
			return statusMatrix({
				fs: withLazyFetching(rawFs, "statusMatrix", delayedAction),
				dir,
				filter: cmdArgs.filter,
			})
		},

		add(cmdArgs) {
			return add({
				fs: withLazyFetching(rawFs, "add", delayedAction),
				dir,
				filepath: cmdArgs.filepath,
			})
		},

		commit(cmdArgs) {
			return commit({
				fs: withLazyFetching(rawFs, "commit", delayedAction),
				dir,
				author: cmdArgs.author,
				message: cmdArgs.message,
			})
		},

		push() {
			return push({
				fs: withLazyFetching(rawFs, "push", delayedAction),
				url: gitUrl,
				corsProxy: gitProxyUrl,
				http,
				dir,
			})
		},

		pull(cmdArgs) {
			return pull({
				fs: withLazyFetching(rawFs, "pull", delayedAction),
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
				fs: withLazyFetching(rawFs, "log", delayedAction),
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
					fs: withLazyFetching(rawFs, "getCurrentBranch", delayedAction),
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
