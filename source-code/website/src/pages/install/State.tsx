import { currentPageContext } from "#src/renderer/state.js"
import {
	createContext,
	createEffect,
	createResource,
	createSignal,
	JSXElement,
	Resource,
	Setter,
	useContext,
} from "solid-js"
import type { InstallationRouteParams } from "./types.js"
import type { LocalStorageSchema } from "#src/services/local-storage/index.js"
import { getLocalStorage, useLocalStorage } from "#src/services/local-storage/index.js"
import { github } from "#src/services/github/index.js"
import { showToast } from "#src/components/Toast.jsx"
import { telemetryBrowser, parseOrigin } from "@inlang/telemetry"
import type { NodeishFilesystem } from "@inlang-git/fs"
import { createNodeishMemoryFs } from "@inlang-git/fs"
import { http, raw } from "@inlang-git/client/raw"
import {
	LanguageTag,
	LintRule,
	Result,
	createInlang,
	type InlangProject,
	type Message,
} from "@inlang/app"
import type { InlangModule } from "@inlang/module"

type EditorStateSchema = {
	/**
	 * Whether a repository is cloned and when it was cloned.
	 *
	 * The value is `false` if the repository is not cloned. Otherwise,
	 * a Date is provided that reflects the time of when the repository
	 * was cloned.
	 */
	repositoryIsCloned: Resource<undefined | Date>
	/**
	 * The current branch.
	 */
	currentBranch: Resource<string | undefined>
	/**
	 * Unpushed changes in the repository.
	 */
	unpushedChanges: Resource<Awaited<ReturnType<typeof raw.log>>>
	/**
	 * Additional information about a repository provided by GitHub.
	 */
	githubRepositoryInformation: Resource<
		Awaited<ReturnType<typeof github.request<"GET /repos/{owner}/{repo}">>>
	>
	/**
	 * Route parameters like `/github.com/inlang/website`.
	 *
	 * Utility to access the route parameters in a typesafe manner.
	 */
	routeParams: () => InstallationRouteParams

	/**
	 * Search parameters of editor route like `?branch=main`.
	 *
	 * Utility to access the route parameters in a typesafe manner.
	 */
	searchParams: () => InstallationRouteParams

	/**
	 * Virtual filesystem
	 */
	fs: () => NodeishFilesystem

	/**
	 * Id to filter messages
	 */
	filteredId: () => string
	setFilteredId: Setter<string>

	/**
	 * TextSearch to filter messages
	 */
	textSearch: () => string
	setTextSearch: Setter<string>

	/**
	 * The filesystem is not reactive, hence setFsChange to manually
	 * trigger re-renders.
	 *
	 * setFsChange manually to `Date.now()`
	 */
	fsChange: () => Date
	setFsChange: Setter<Date>

	/**
	 * The current inlang config.
	 *
	 * Undefined if no inlang config exists/has been found.
	 */
	inlang: Resource<InlangProject | undefined>

	doesInlangConfigExist: () => boolean

	sourceLanguageTag: () => LanguageTag | undefined

	languageTags: () => LanguageTag[]
	setLanguageTags: Setter<LanguageTag[]>

	/**
	 * FilterLanguages show or hide the different messages.
	 */
	filteredLanguageTags: () => LanguageTag[]
	setFilteredLanguageTags: Setter<LanguageTag[]>

	/**
	 * Filtered lint rules.
	 */
	filteredLintRules: () => LintRule["meta"]["id"][]
	setFilteredLintRules: Setter<LintRule["meta"]["id"][]>

	/**
	 * Unpushed changes in the repository.
	 */

	localChanges: () => number // Message[]
	setLocalChanges: Setter<number> // Setter<Message[]>

	/**
	 * The reference resource.
	 */
	sourceMessages: () => Message[] | undefined

	/**
	 * Whether the user is a collaborator of the repository.
	 *
	 * Check whether the user is logged in before using this resource.
	 * Otherwise, the resource might throw an error.
	 *
	 * @example
	 * 	if (user && isCollaborator())
	 */
	userIsCollaborator: Resource<boolean>

	/**
	 * Whether the is private or not.
	 */
	repoIsPrivate: Resource<boolean | undefined>

	/**
	 * The last time the repository was pushed.
	 */
	setLastPush: Setter<Date | undefined>

	/**
	 * The last time the repository has been pulled.
	 */
	setLastPullTime: Setter<Date | undefined>
}

export function InstallationStateProvider(props: { children: JSXElement }) {
	/**
	 *  Date of the last push to the Repo
	 */
	const [lastPush, setLastPush] = createSignal<Date>()

	const [localChanges, setLocalChanges] = createSignal<number>(0)

	const routeParams = () => currentPageContext.routeParams as InstallationRouteParams

	const [fsChange, setFsChange] = createSignal(new Date())

	const [doesInlangConfigExist, setDoesInlangConfigExist] = createSignal<boolean>(false)

	//set filter with search params
	const params = new URL(document.URL).searchParams

	const [fs, setFs] = createSignal<NodeishFilesystem>(createNodeishMemoryFs())

	const [localStorage] = useLocalStorage() ?? []

	// re-fetched if currentPageContext changes
	const [repositoryIsCloned] = createResource(
		() => {
			// re-initialize fs on every cloneRepository call
			// until subdirectories are supported
			setFs(createNodeishMemoryFs())
			return {
				fs: fs(),
				routeParams: currentPageContext.routeParams as InstallationRouteParams,
				user: localStorage?.user,
				setFsChange,
			}
		},
		async (args) => {
			const result = await cloneRepository(args)
			// not blocking the execution by using the callback pattern
			// the user does not need to wait for the response
			// checks whether the gitOrigin corresponds to the pattern.

			return

			const gitOrigin = parseOrigin({ remotes: await getGitOrigin(args) })
			//You must include at least one group property for a group to be visible in the "Persons & Groups" tab
			//https://posthog.com/docs/product-analytics/group-analytics#setting-and-updating-group-properties
			telemetryBrowser.group("repository", gitOrigin, {
				name: gitOrigin,
			})
			github
				.request("GET /repos/{owner}/{repo}", {
					owner: args.routeParams.owner,
					repo: args.routeParams.repository,
				})
				.then((response) => {
					telemetryBrowser.group("repository", gitOrigin, {
						visibility: response.data.private ? "Private" : "Public",
						isFork: response.data.fork ? "Fork" : "isNotFork",
						// parseOrgin requiers a "remote"="origing" to transform the url in the git origin
						parentGitOrigin: response.data.parent?.git_url
							? parseOrigin({ remotes: [{ remote: "origin", url: response.data.parent.git_url }] })
							: "",
					})
					telemetryBrowser.capture("EDITOR cloned repository", {
						owner: args.routeParams.owner,
						repository: args.routeParams.repository,
						userPermission: userIsCollaborator() ? "iscollaborator" : "isNotCollaborator",
					})
				})
				.catch((error) => {
					telemetryBrowser.capture("EDITOR cloned repository", {
						owner: args.routeParams.owner,
						repository: args.routeParams.repository,
						errorDuringIsPrivateRequest: error,
						userPermission: userIsCollaborator() ? "collaborator" : "contributor",
					})
				})

			return result
		},
	)

	const [inlang] = createResource(
		() => {
			if (
				repositoryIsCloned.error ||
				repositoryIsCloned.loading ||
				repositoryIsCloned() === undefined
			) {
				return false
			}
			return {
				fs: fs(),
				// BUG: this is not reactive
				// See https://github.com/inlang/inlang/issues/838#issuecomment-1560745678
				// we need to listen to inlang.config.js changes
				// lastFsChange: fsChange(),
			}
		},
		async () => {
			const inlang = await createInlang({
				configPath: "./inlang.config.json",
				nodeishFs: fs(),
				_import: async () =>
					({
						default: {
							// @ts-ignore
							plugins: [...pluginJson.plugins],
							// @ts-ignore
							lintRules: [...pluginLint.lintRules],
						},
					} satisfies InlangModule),
			})
			const config = inlang.config()
			return inlang
		},
	)

	const [userIsCollaborator] = createResource(
		/**
		 * createResource is not reacting to changes like: "false","Null", or "undefined".
		 * Hence, a string needs to be passed to the fetch of the resource.
		 */
		() => {
			// do not fetch if no owner or repository is given
			// can happen if the user navigated away from the editor
			if (
				currentPageContext.routeParams.owner === undefined ||
				currentPageContext.routeParams.repository === undefined
			) {
				return false
			}
			return {
				user: localStorage?.user ?? "not logged in",
				routeParams: currentPageContext.routeParams as EditorRouteParams,
			}
		},
		async (args) => {
			// user is not logged in, see the returned object above
			if (typeof args.user === "string") {
				return false
			}
			try {
				const response = await github.request(
					"GET /repos/{owner}/{repo}/collaborators/{username}",
					{
						owner: args.routeParams.owner,
						repo: args.routeParams.repository,
						username: args.user.username,
					},
				)
				return response.status === 204 ? true : false
			} catch (error) {
				// the user is not a collaborator, hence the request will fail
				return false
			}
		},
	)

	return props.children
}

async function cloneRepository(args: {
	fs: NodeishFilesystem
	routeParams: InstallationRouteParams
	user: LocalStorageSchema["user"]
	setFsChange: (date: Date) => void
}): Promise<Date | undefined> {
	console.log("cloneRepository", args)

	// if (host === undefined || owner === undefined || repository === undefined) {
	// 	return undefined
	// }

	// // do shallow clone, get first commit and just one branch
	// await raw.clone({
	// 	fs: args.fs,
	// 	http,
	// 	dir: "/",
	// 	corsProxy: publicEnv.PUBLIC_GIT_PROXY_PATH,
	// 	url: `https://${host}/${owner}/${repository}`,
	// 	singleBranch: true,
	// 	depth: 1,
	// })

	// // fetch 100 more commits, can get more commits if needed
	// // https://isomorphic-git.org/docs/en/faq#how-to-make-a-shallow-repository-unshallow
	// raw.fetch({
	// 	fs: args.fs,
	// 	http,
	// 	dir: "/",
	// 	// corsProxy: clientSideEnv.VITE_GIT_REQUEST_PROXY_PATH,
	// 	url: `https://${host}/${owner}/${repository}`,
	// 	depth: 100,
	// 	relative: true,
	// })

	// // triggering a side effect here to trigger a re-render
	// // of components that depends on fs
	// const date = new Date()
	// args.setFsChange(date)
	// return date
}
