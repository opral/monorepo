import { currentPageContext } from "#src/renderer/state.js"
import {
	createContext,
	createEffect,
	createMemo,
	createResource,
	createSignal,
	from,
	type JSXElement,
	type Resource,
	type Setter,
	useContext,
	type Accessor,
	on,
} from "solid-js"
import type { EditorRouteParams, EditorSearchParams } from "./types.js"
import type { LocalStorageSchema } from "#src/services/local-storage/index.js"
import { useLocalStorage } from "#src/services/local-storage/index.js"
import type { TourStepId } from "./components/Notification/TourHintWrapper.jsx"
import { setSearchParams } from "./helper/setSearchParams.js"
import {
	openRepository,
	createNodeishMemoryFs,
	type Repository,
	type LixError,
} from "@lix-js/client"

import { publicEnv } from "@inlang/env-variables"
import {
	LanguageTag,
	MessageLintRule,
	loadProject,
	solidAdapter,
	listProjects,
	type InlangProjectWithSolidAdapter,
} from "@inlang/sdk"
import { posthog as telemetryBrowser } from "posthog-js"
import type { Result } from "@inlang/result"
import { id } from "../../../../../marketplace-manifest.json"

type EditorStateSchema = {
	/**
	 * Returns a repository object
	 */
	repo: () => Repository | undefined
	/**
	 * Refetch the repository.
	 */
	refetchRepo: () => void
	/**
	 * Fork status of the repository.
	 */

	forkStatus: () => { ahead: number; behind: number; conflicts: Record<string, any> | undefined }
	/**
	 * Refetch the fork status.
	 */
	refetchForkStatus: () => void
	/**
	 * The current branch.
	 */
	mutateForkStatus: (args: { ahead: number; behind: number; conflicts: boolean }) => void

	pushChanges: (args: {
		user: LocalStorageSchema["user"]
		setFsChange: (date: Date) => void
		setLastPullTime: (date: Date) => void
	}) => Promise<Result<true, PushException>>

	mergeUpstream: () => Promise<Awaited<ReturnType<Repository["mergeUpstream"]>>>

	createFork: () => Promise<Awaited<ReturnType<Repository["createFork"]>>>

	currentBranch: Resource<string | undefined>
	/**
	 * The branch names of current repo.
	 */
	setBranchListEnabled: Setter<boolean>
	/**
	 * Trigger the branch list to be fetched.
	 */
	branchList: Resource<string[] | undefined>
	/**
	 * Additional information about a repository provided by GitHub.
	 */

	githubRepositoryInformation: Resource<Awaited<ReturnType<Repository["getMeta"]>> | undefined>
	/**
	 * Route parameters like `/github.com/inlang/website`.
	 *
	 * Utility to access the route parameters in a typesafe manner.
	 */
	routeParams: () => EditorRouteParams

	/**
	 * Search parameters of editor route like `?branch=main`.
	 *
	 * Utility to access the route parameters in a typesafe manner.
	 */
	searchParams: () => EditorSearchParams

	/**
	 * Id to filter messages
	 */
	filteredIds: () => string[]
	setFilteredIds: Setter<string[]>

	/**
	 * TextSearch to filter messages
	 */
	textSearch: () => string
	setTextSearch: Setter<string>

	/**
	 * Reference link to from where the user came from.
	 */
	refLink: () => string
	setRefLink: Setter<string>

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
	project: Resource<InlangProjectWithSolidAdapter | undefined>

	refetchProject: () => void

	/**
	 * List of projects in the repository.
	 */
	projectList: Resource<{ projectPath: string }[]>

	sourceLanguageTag: () => LanguageTag

	languageTags: () => LanguageTag[]

	tourStep: () => TourStepId
	setTourStep: Setter<TourStepId>

	setActiveBranch: Setter<string | undefined>
	activeBranch: Accessor<string | undefined>

	setActiveProject: Setter<string | undefined>
	activeProject: Accessor<string | undefined>

	/**
	 * FilterLanguages show or hide the different messages.
	 */
	filteredLanguageTags: () => LanguageTag[]
	setFilteredLanguageTags: Setter<LanguageTag[]>

	/**
	 * Filtered lint rules.
	 */
	filteredMessageLintRules: () => MessageLintRule["id"][]
	setFilteredMessageLintRules: Setter<MessageLintRule["id"][]>

	/**
	 * Expose lix errors that happen wihle opening the repository
	 */
	lixErrors: () => LixError[]

	/**
	 * Unpushed changes in the repository.
	 */

	localChanges: () => number // Message[]
	setLocalChanges: Setter<number> // Setter<Message[]>

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
	 * The last time the repository has been pulled.
	 */
	lastPullTime: () => Date | undefined
	setLastPullTime: Setter<Date | undefined>
}

const EditorStateContext = createContext<EditorStateSchema>()

export const useEditorState = () => {
	const context = useContext(EditorStateContext)
	if (context === undefined) {
		throw Error(
			"The EditorStateContext is undefined. useEditorState must be used within a EditorStateProvider"
		)
	}
	return context
}

/**
 * `<EditorStateProvider>` initializes state with a computations such resources.
 *
 * See https://www.solidjs.com/tutorial/stores_context.
 */
export function EditorStateProvider(props: { children: JSXElement }) {
	const [localChanges, setLocalChanges] = createSignal<number>(0)

	const routeParams = () => currentPageContext.routeParams as EditorRouteParams

	const searchParams = () => currentPageContext.urlParsed.search as EditorSearchParams

	const [fsChange, setFsChange] = createSignal(new Date())

	const [tourStep, setTourStep] = createSignal<TourStepId>("none")

	/**
	 *  Date of the last push to the Repo
	 */
	const [lastPullTime, setLastPullTime] = createSignal<Date>()

	//set filter with search params
	const params = new URL(document.URL).searchParams

	const [filteredIds, setFilteredIds] = createSignal<string[]>(params.getAll("id") as string[])
	createEffect(() => {
		setSearchParams({ key: "id", value: filteredIds() })
	})

	const [textSearch, setTextSearch] = createSignal<string>((params.get("search") || "") as string)
	createEffect(() => {
		setSearchParams({ key: "search", value: textSearch() })
	})

	const [filteredLanguageTags, setFilteredLanguageTags] = createSignal<LanguageTag[]>(
		params.getAll("lang") as string[]
	)
	createEffect(() => {
		setSearchParams({ key: "lang", value: filteredLanguageTags() })
	})

	const [filteredMessageLintRules, setFilteredMessageLintRules] = createSignal<
		MessageLintRule["id"][]
	>(params.getAll("lint") as MessageLintRule["id"][])
	createEffect(() => {
		setSearchParams({ key: "lint", value: filteredMessageLintRules() })
	})

	const [refLink, setRefLink] = createSignal<string>((params.get("ref") || "") as string)
	createEffect(() => {
		setSearchParams({ key: "ref", value: refLink() })
	})

	const [localStorage] = useLocalStorage() ?? []

	// get lix errors
	const [lixErrors, setLixErrors] = createSignal<Error[]>([])

	const [activeBranch, setActiveBranch] = createSignal<string | undefined>(
		params.get("branch") || undefined
	)
	createEffect(() => {
		const branch = activeBranch()
		if (branch) {
			setSearchParams({ key: "branch", value: branch })
		}
	})
	const [repo, { refetch: refetchRepo }] = createResource(
		() => {
			return { routeParams: routeParams(), user: localStorage.user, branch: activeBranch() }
		},
		async ({ routeParams: { host, owner, repository }, branch, user }) => {
			if (host && owner && repository && user) {
				try {
					const newRepo = await openRepository(
						`${publicEnv.PUBLIC_GIT_PROXY_BASE_URL}/git/${host}/${owner}/${repository}`,
						{
							nodeishFs: createNodeishMemoryFs(),
							branch,
							// debugTime: true,
							// for testing purposes. if commented out, will use whitelist to enable for certain repos
							// experimentalFeatures: {
							// 	lazyClone: true,
							// 	lixCommit: true,
							// }
						}
					)

					if (window && !import.meta.env.PROD) {
						// @ts-expect-error
						window.repo = newRepo
					}
					setLixErrors([])

					// @ts-ignore -- causes reactivity bugs because the sdk uses watch and triggers updates on changes caused by itself
					newRepo.nodeishFs.watch = () => {}

					setLastPullTime(new Date())
					setLocalChanges(0)
					// Invalidate the project while we switch branches
					setProject(undefined)
					return newRepo
				} catch (e) {
					if (
						e instanceof Error &&
						e.name === "NotFoundError" &&
						e.message === `Could not find ${activeBranch()}.`
					) {
						// redirect to default branch (e.g. main) if branch not found
						setActiveBranch(undefined)
						setSearchParams({ key: "branch", value: "" })
						return
					}
					setLixErrors([e as Error])
					return
				}
			} else {
				return
			}
		}
	)

	async function pushChanges(args: {
		user: LocalStorageSchema["user"]
		setFsChange: (date: Date) => void
		setLastPullTime: (date: Date) => void
	}): Promise<Result<true, PushException>> {
		const loadedRepo = repo()
		if (!loadedRepo) {
			return { error: new PushException("Repo not loaded") }
		}

		if (typeof args.user === "undefined" || args.user?.isLoggedIn === false) {
			return { error: new PushException("User not logged in") }
		}

		const filesWithUncommittedChanges = await loadedRepo.statusList({
			filter: (f: any) =>
				f.endsWith("project_id") ||
				f.endsWith(".json") ||
				f.endsWith(".po") ||
				f.endsWith(".yaml") ||
				f.endsWith(".yml") ||
				f.endsWith(".js") ||
				f.endsWith(".ts"),
		})

		if (filesWithUncommittedChanges.length > 0) {
			// commit changes
			await loadedRepo.commit({
				author: {
					name: args.user.username,
					email: args.user.email,
				},
				message: "chore: update translations with Fink 🐦",
				include: filesWithUncommittedChanges.map((f) => f[0]),
			})
		}

		// triggering a side effect here to trigger a re-render
		// of components that depends on fs
		args.setFsChange(new Date())
		// push changes
		try {
			const push = await loadedRepo.push().catch((error) => ({ error }))
			if (push?.error) {
				return { error: new PushException("Failed to push", { cause: push.error }) }
			}
			await loadedRepo.pull({
				author: {
					name: args.user.username,
					email: args.user.email,
				},
				fastForward: true,
				singleBranch: true,
			})
			const time = new Date()
			// triggering a rebuild of everything fs related
			args.setFsChange(time)
			args.setLastPullTime(time)
			return { data: true }
		} catch (error) {
			return { error: (error as PushException) ?? "Unknown error" }
		}
	}

	async function mergeUpstream(): Promise<Awaited<ReturnType<Repository["mergeUpstream"]>>> {
		const loadedRepo = repo()
		if (!loadedRepo) {
			throw new Error("Repo not loaded")
		}

		return loadedRepo.mergeUpstream()
	}

	async function createFork() {
		const loadedRepo = repo()
		if (!loadedRepo) {
			throw new Error("Repo not loaded yet")
		}
		return await loadedRepo.createFork()
	}

	const [projectList] = createResource(
		() => {
			return { repo: repo() }
		},
		async (args) => {
			if (args.repo?.nodeishFs === undefined) return []
			const projects = await listProjects(args.repo?.nodeishFs, "/")

			if (
				searchParams().project &&
				projects.some((project: any) => project.projectPath === searchParams().project)
			) {
				setActiveProject(searchParams().project)
			} else if (projects.length === 1) {
				setActiveProject(projects[0]?.projectPath)
			} else if (
				projects.length > 1 &&
				projects.some((project: any) => project.projectPath === "/project.inlang")
			) {
				setActiveProject("/project.inlang")
			} else {
				setActiveProject(projects[0]?.projectPath)
			}
			return projects
		}
	)

	const [activeProject, setActiveProject] = createSignal<string | undefined>(
		params.get("project") || undefined
	)

	createEffect(() => {
		const projectPath = activeProject()
		if (projectPath) {
			setSearchParams({ key: "project", value: projectPath })
		}
	})

	// polyfill requestIdleCallback for Safari browser
	const requestIdleCallback = window.requestIdleCallback || function (callback: any) {
		const start = Date.now()
		return setTimeout(function () {
			callback({
				didTimeout: false,
				timeRemaining: function () {
					return Math.max(0, 50 - (Date.now() - start))
				}
			});
		}, 1)
	}

	// open the inlang project and store it in a resource
	const [project, { refetch: refetchProject, mutate: setProject }] = createResource(
		() => {
			if (repo() === undefined || activeProject() === undefined) {
				return false
			}
			return { newRepo: repo(), activeProject: activeProject() }
		},
		async ({ newRepo, activeProject }) => {
			// wait for the browser to be idle
			await new Promise((resolve) => requestIdleCallback(resolve))
			if (newRepo) {
				const project = solidAdapter(
					await loadProject({
						repo: newRepo,
						projectPath: activeProject!,
						appId: id,
					}),
					{ from }
				)
				if (project.id) {
					telemetryBrowser.group("project", project.id)
				}
				telemetryBrowser.capture("EDITOR cloned repository", {
					userPermission: userIsCollaborator() ? "iscollaborator" : "isNotCollaborator",
				})
				return project
			} else {
				return undefined
			}
		}
	)

	// DERIVED source language tag from project settings
	const sourceLanguageTag = createMemo(() => {
		// If no project or settings are available, an error message is shown
		// in the editor. The source language tag "en" is not used in this case.
		return project()?.settings()?.sourceLanguageTag ?? "en"
	})

	// DERIVED language tags from project settings
	const languageTags = createMemo(() => {
		return project()?.settings()?.languageTags ?? []
	})

	//the effect should skip tour guide steps if not needed
	createEffect(() => {
		if (localStorage?.user === undefined || userIsCollaborator.loading) {
			setTourStep("none")
		} else if (localStorage?.user?.isLoggedIn === false) {
			setTourStep("github-login")
		} else if (userIsCollaborator() === false) {
			setTourStep("fork-repository")
		} else if (tourStep() === "fork-repository" && project()) {
			if (project()?.installed.messageLintRules().length === 0) {
				setTourStep("missing-lint-rules")
			} else {
				setTimeout(() => {
					const element = document.getElementById("missingTranslation-summary")
					element !== null &&
					!filteredMessageLintRules().includes("messageLintRule.inlang.missingTranslation")
						? setTourStep("missing-translation-rule")
						: setTourStep("textfield")
				}, 100)
			}
		} else if (tourStep() === "missing-translation-rule" && project()) {
			setTimeout(() => {
				const element = document.getElementById("missingTranslation-summary")
				element !== null &&
				!filteredMessageLintRules().includes("messageLintRule.inlang.missingTranslation")
					? setTourStep("missing-translation-rule")
					: setTourStep("textfield")
			}, 100)
		}
	})

	const [githubRepositoryInformation, { refetch: refetchRepoInfo }] = createResource(
		() => {
			const loadedRepo = repo()
			if (
				localStorage?.user === undefined ||
				routeParams().owner === undefined ||
				routeParams().repository === undefined ||
				loadedRepo === undefined
			) {
				return false
			}
			return {
				repo: loadedRepo,
				user: localStorage.user,
				routeParams: routeParams(),
			}
		},
		async ({ repo: loadedRepo }) => {
			const repoMeta = await loadedRepo.getMeta()
			if ("error" in repoMeta) {
				setLixErrors([repoMeta.error, ...lixErrors()])
			}
			return repoMeta
		}
	)

	/**
	 * createResource is not reacting to changes like: "false","Null", or "undefined".
	 * Hence, a string needs to be passed to the fetch of the resource.
	 */
	const [userIsCollaborator] = createResource(
		() => {
			// do not fetch if no owner or repository is given
			// can happen if the user navigated away from the editor
			// setIsCollaborator(repoMeta?.permissions.push)
			if (
				currentPageContext.routeParams.owner === undefined ||
				currentPageContext.routeParams.repository === undefined
			) {
				return false
			}
			return {
				user: localStorage?.user?.isLoggedIn ?? "not logged in",
				routeParams: currentPageContext.routeParams as EditorRouteParams,
				repoMeta: githubRepositoryInformation(),
			}
		},
		(args) => {
			// user is not logged in, see the returned object above
			if (
				typeof args.repoMeta === "undefined" ||
				typeof args.user === "string" ||
				"error" in args.repoMeta
			) {
				return false
			}
			return args.repoMeta?.permissions?.push || false
		}
	)

	const isForkSyncDisabled = () =>
		localStorage.disableForkSyncWarning?.some(
			(repo) => repo.owner === routeParams().owner && repo.repository === routeParams().repository
		)

	const [forkStatus, { refetch: refetchForkStatus, mutate: mutateForkStatus }] = createResource(
		() => {
			const repoMeta = githubRepositoryInformation()
			if (
				userIsCollaborator() &&
				repo() &&
				!isForkSyncDisabled() &&
				repoMeta &&
				!("error" in repoMeta) &&
				repoMeta.isFork
			) {
				return { repo: repo() }
			} else {
				return false
			}
		},
		async (args) => {
			await new Promise((resolve) => setTimeout(resolve, 10000))
			// wait for the browser to be idle
			await new Promise((resolve) => requestIdleCallback(resolve))

			console.info("fetching forkStatus")

			const value = await args.repo!.forkStatus()
			if ("error" in value) {
				// Silently ignore errors:
				// The branch might only exist in the fork and not in the upstream repository.
				return { ahead: 0, behind: 0, conflicts: undefined }
			} else {
				return value
			}
		},
		{ initialValue: { ahead: 0, behind: 0, conflicts: undefined } }
	)

	const [previousLoginStatus, setPreviousLoginStatus] = createSignal(localStorage?.user?.isLoggedIn)
	createEffect(
		on(
			() => localStorage.user?.isLoggedIn,
			() => {
				const isLoggedIn = localStorage?.user?.isLoggedIn
				if (previousLoginStatus() === false && isLoggedIn) {
					if (!repo.loading && repo() === undefined) {
						// Refetch private repo after login
						refetchRepo()
					} else if (!githubRepositoryInformation.loading) {
						// Refetch public repo info after login
						refetchRepoInfo()
					}
				}
				setPreviousLoginStatus(isLoggedIn)
			}
		)
	)

	const [currentBranch] = createResource(
		() => {
			if (repo() === undefined) {
				return {}
			} else {
				return { repo: repo() }
			}
		},
		async (args) => {
			return await args.repo?.getCurrentBranch()
		}
	)

	const [branchListEnabled, setBranchListEnabled] = createSignal(false)
	const [branchList] = createResource(
		() => {
			if (
				repo() === undefined ||
				githubRepositoryInformation() === undefined ||
				!branchListEnabled()
			) {
				return false
			}
			return { repo: repo() }
		},
		async (args) => {
			console.info("fetching branchList")
			return await args.repo?.getBranches()
		}
	)

	return (
		<EditorStateContext.Provider
			value={
				{
					repo: repo,
					refetchRepo,
					forkStatus,
					mutateForkStatus,
					refetchForkStatus,
					pushChanges,
					mergeUpstream,
					createFork,
					currentBranch,
					setBranchListEnabled,
					branchList,
					githubRepositoryInformation,
					routeParams,
					searchParams,
					filteredIds,
					setFilteredIds,
					textSearch,
					setTextSearch,
					refLink,
					setRefLink,
					fsChange,
					setFsChange,
					project,
					refetchProject,
					projectList,
					sourceLanguageTag,
					languageTags,
					tourStep,
					setTourStep,
					filteredLanguageTags,
					setFilteredLanguageTags,
					filteredMessageLintRules,
					setFilteredMessageLintRules,
					setActiveBranch,
					activeBranch,
					setActiveProject,
					activeProject,
					localChanges,
					setLocalChanges,
					userIsCollaborator,
					lastPullTime,
					setLastPullTime,
					lixErrors,
				} satisfies EditorStateSchema
			}
		>
			{props.children}
		</EditorStateContext.Provider>
	)
}

// ------------------------------------------

export class PullException extends Error {
	readonly #id = "PullException"
}

export class PushException extends Error {
	readonly #id = "PushException"
	data?: {
		statusCode?: number
	}
}

export class UnknownException extends Error {
	readonly #id = "UnknownException"

	constructor(readonly id: string) {
		super(id)
	}
}
