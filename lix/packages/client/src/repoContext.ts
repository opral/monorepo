import type { NodeishFilesystem } from "@lix-js/fs"
import isoGit from "../vendored/isomorphic-git/index.js"
import whitelistedExperimentalRepos from "./allowedRepos.js"
import { makeGithubClient } from "./github/client.js"
import { parseLixUri } from "./helpers.js"

export type RepoContext = Awaited<ReturnType<typeof repoContext>>

export async function repoContext(
	url: string,
	args: {
		author?: any
		nodeishFs?: NodeishFilesystem
		workingDirectory?: string
		// auth?: unknown // unimplemented
		debug?: boolean
		experimentalFeatures?: {
			lixFs?: boolean
			lazyClone?: boolean
			lixCommit?: boolean
		}
	}
) {
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
		// @ts-ignore --  we expose the raw fs to the window object for debugging
		window["rawFs"] = rawFs
	}

	// TODO: use propper shallow .git format and checks https://linear.app/opral/issue/LIX-37/add-proper-sparse-and-filter-setting-to-git-repo-config

	// the url format for lix urls is
	// https://lix.inlang.com/git/githubClient.com/opral/monorepo
	// proto:// lixServer / namespace / repoHost / owner / repoName
	// namespace is ignored until switching from git.inlang.com to lix.inlang.com and can eveolve in future to be used for repoType, api type or feature group
	// the url format for direct github urls without a lix server is https://githubClient.com/inlang/examplX (only per domain-enabled git hosters will be supported, currently just gitub)
	// the url for opening a local repo allready in the fs provider is file://path/to/repo (not implemented yet)

	// TODO: check for same origin
	let freshClone = false

	// the directory we use for all git operations as repo root, if we are interested in a repo subdirectory we have to append this
	// TODO: add more tests for non root dir command
	let dir = "/"

	if (url.startsWith("file:")) {
		dir = url.replace("file://", "")

		const remotes = await isoGit
			.listRemotes({
				fs: rawFs,
				dir,
			})
			.catch(() => [])
		const origin = remotes.find(({ remote }) => remote === "origin")?.url || ""

		if (origin.startsWith("git@githubClient.com:")) {
			url = origin.replace("git@githubClient.com:", "https://githubClient.com/")
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
	// see line 44 for explanation of lix uri parts
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
		args.experimentalFeatures ||
		(isWhitelistedRepo ? { lazyClone: freshClone, lixCommit: true } : {})

	const useLazyFS = experimentalFeatures?.lazyClone && args.nodeishFs?._createPlaceholder

	const cache = useLazyFS ? {} : undefined

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

	const githubClient = makeGithubClient({ gitHubProxyUrl })

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

	return {
		gitUrl,
		gitProxyUrl,

		protocol,
		lixHost,
		repoHost,
		owner,
		repoName,
		username,
		password,
		namespace,

		useLazyFS,
		githubClient,
		debug,
		experimentalFeatures,
		author,
		freshClone,
		dir,

		// maybe handle these different when touching lixFS impl.
		rawFs,
		cache,
	}
}
