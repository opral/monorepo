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
} from "solid-js"
import type { EditorRouteParams, EditorSearchParams } from "./types.js"
import type { LocalStorageSchema } from "#src/services/local-storage/index.js"
import { useLocalStorage } from "#src/services/local-storage/index.js"
import type { TourStepId } from "./components/Notification/TourHintWrapper.jsx"
import { setSearchParams } from "./helper/setSearchParams.js"
import { openRepository, createNodeishMemoryFs, type Repository, browserAuth } from "@lix-js/client"
import { publicEnv } from "@inlang/env-variables"
import {
	LanguageTag,
	MessageLintRule,
	loadProject,
	solidAdapter,
	type InlangProjectWithSolidAdapter,
} from "@inlang/sdk"
import { telemetryBrowser } from "@inlang/telemetry"
import type { Result } from "@inlang/result"

type EditorStateSchema = {
	/**
	 * Returns a repository object
	 */
	repo: () => Repository | undefined

	/**
	 * The current branch.
	 */
	currentBranch: Resource<string | undefined>
	/**
	 * The branch names of current repo.
	 */
	branchNames: Resource<string[] | undefined>
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
	project: Resource<InlangProjectWithSolidAdapter | undefined>

	doesInlangConfigExist: () => boolean

	sourceLanguageTag: () => LanguageTag | undefined

	languageTags: () => LanguageTag[]

	tourStep: () => TourStepId
	setTourStep: Setter<TourStepId>

	setActiveBranch: Setter<string | undefined>
	activeBranch: Accessor<string | undefined>

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
	lixErrors: () => ReturnType<Repository["errors"]>

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

	const [tourStep, setTourStep] = createSignal<TourStepId>("github-login")

	/**
	 *  Date of the last push to the Repo
	 */
	const [lastPullTime, setLastPullTime] = createSignal<Date>()

	//set filter with search params
	const params = new URL(document.URL).searchParams

	const [filteredId, setFilteredId] = createSignal<string>((params.get("id") || "") as string)
	createEffect(() => {
		setSearchParams({ key: "id", value: filteredId() })
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

	const [localStorage] = useLocalStorage() ?? []

	// get lix errors
	const [lixErrors, setLixErrors] = createSignal<ReturnType<Repository["errors"]>>([])

	const [activeBranch, setActiveBranch] = createSignal<string | undefined>(
		params.get("branch") || undefined
	)
	createEffect(() => {
		const branch = activeBranch()
		if (branch) {
			setSearchParams({ key: "branch", value: branch })
		}
	})
	const [repo] = createResource(
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
							auth: browserAuth,
							branch,
						}
					)
					// @ts-expect-error
					newRepo.nodeishFs.watch = () => undefined
					setLastPullTime(new Date())
					// Invalidate the project while we switch branches
					setProject(undefined)
					return newRepo
				} catch (err) {
					console.error(err)
					return
				}
			} else {
				return
			}
		}
	)

	repo()?.errors.subscribe((errors) => {
		setLixErrors(errors)
	})

	// open the inlang project and store it in a resource
	const [project, { mutate: setProject }] = createResource(
		() => {
			if (repo() === undefined || lixErrors().length > 0) {
				return false
			}
			return { newRepo: repo(), lixErrors: lixErrors() }
		},
		async ({ newRepo, lixErrors }) => {
			if (lixErrors.length === 0 && newRepo) {
				const project = solidAdapter(
					await loadProject({
						nodeishFs: newRepo.nodeishFs,
						repo: newRepo,
						projectPath: "/project.inlang",
						_capture(id, props) {
							telemetryBrowser.capture(id, props)
						},
					}),
					{ from }
				)

				telemetryBrowser.capture("EDITOR cloned repository", {
					userPermission: userIsCollaborator() ? "iscollaborator" : "isNotCollaborator",
				})
				return project
			} else {
				return undefined
			}
		}
	)

	// DERIVED when config exists
	const doesInlangConfigExist = createMemo(() => {
		return project()?.settings() ? true : false
	})

	// DERIVED source language tag from inlang config
	const sourceLanguageTag = createMemo(() => {
		return project()?.settings()?.sourceLanguageTag
	})

	// DERIVED language tags from inlang config
	const languageTags = createMemo(() => {
		return project()?.settings()?.languageTags ?? []
	})

	//the effect should skip tour guide steps if not needed
	createEffect(() => {
		if (localStorage?.user?.isLoggedIn === false) {
			setTourStep("github-login")
		} else if (!userIsCollaborator()) {
			setTourStep("fork-repository")
		} else if (tourStep() === "fork-repository" && project()) {
			if (project()?.installed.messageLintRules().length === 0) {
				setTourStep("missing-lint-rules")
			} else {
				setTimeout(() => {
					const element = document.getElementById("missingTranslation-summary")
					element !== null ? setTourStep("missing-translation-rule") : setTourStep("textfield")
				}, 100)
			}
		} else if (tourStep() === "missing-translation-rule" && project()) {
			setTimeout(() => {
				const element = document.getElementById("missingTranslation-summary")
				element !== null ? setTourStep("missing-translation-rule") : setTourStep("textfield")
			}, 100)
		}
	})

	const [githubRepositoryInformation, { refetch }] = createResource(
		() => {
			if (
				localStorage?.user === undefined ||
				routeParams().owner === undefined ||
				routeParams().repository === undefined ||
				repo() === undefined
			) {
				return false
			}
			return {
				user: localStorage.user,
				routeParams: routeParams(),
			}
		},
		async () => {
			const repoMeta = await repo()?.getMeta()
			return repoMeta
		}
	)

	createEffect(() => {
		if (localStorage?.user?.isLoggedIn) refetch()
	})

	const [currentBranch] = createResource(
		() => {
			if (lixErrors().length > 0 || repo() === undefined) {
				return {}
			} else {
				return { repo: repo() }
			}
		},
		async (args) => {
			return await args.repo?.getCurrentBranch()
		}
	)

	const [branchNames] = createResource(
		() => {
			return { repo: repo() }
		},
		async (args) => {
			return await args.repo?.getBranches()
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
				currentRepo: repo(),
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

	return (
		<EditorStateContext.Provider
			value={
				{
					repo: repo,
					currentBranch,
					branchNames,
					githubRepositoryInformation,
					routeParams,
					searchParams,
					filteredId,
					setFilteredId,
					textSearch,
					setTextSearch,
					fsChange,
					setFsChange,
					project,
					doesInlangConfigExist,
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

/**
 * Pushed changes and pulls right afterwards.
 */
export async function pushChanges(args: {
	repo: Repository
	user: LocalStorageSchema["user"]
	setFsChange: (date: Date) => void
	setLastPullTime: (date: Date) => void
}): Promise<Result<true, PushException>> {
	if (typeof args.user === "undefined" || args.user?.isLoggedIn === false) {
		return { error: new PushException("User not logged in") }
	}

	// stage all changes
	const status = await args.repo.statusMatrix({
		filter: (f: any) =>
			f.endsWith("project_id") ||
			f.endsWith(".json") ||
			f.endsWith(".po") ||
			f.endsWith(".yaml") ||
			f.endsWith(".yml") ||
			f.endsWith(".js") ||
			f.endsWith(".ts"),
	})

	const filesWithUncommittedChanges = status.filter(
		(row: any) =>
			// files with unstaged and uncommitted changes
			(row[2] === 2 && row[3] === 1) ||
			// added files
			(row[2] === 2 && row[3] === 0)
	)

	if (filesWithUncommittedChanges.length > 0) {
		// add all changes
		for (const file of filesWithUncommittedChanges) {
			await args.repo.add({ filepath: file[0] })
		}
		// commit changes
		await args.repo.commit({
			author: {
				name: args.user.username,
				email: args.user.email,
			},
			message: "inlang: update translations",
		})
	}

	// triggering a side effect here to trigger a re-render
	// of components that depends on fs
	args.setFsChange(new Date())
	// push changes
	try {
		const push = await args.repo.push()
		if (push?.ok === false) {
			return { error: new PushException("Failed to push", { cause: push.error }) }
		}
		await args.repo.pull({
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
