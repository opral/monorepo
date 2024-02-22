import {
	createEffect,
	createSignal,
	For,
	type JSXElement,
	type Setter,
	on,
	onMount,
	Show,
} from "solid-js"
import { useEditorState } from "./State.jsx"
import { SearchInput } from "./components/SearchInput.jsx"
import { Gitfloat } from "./components/Gitfloat.jsx"
import IconGithub from "~icons/cib/github"
import IconAdd from "~icons/material-symbols/add"
import IconClose from "~icons/material-symbols/close"
import IconSync from "~icons/material-symbols/sync-outline"
import IconTranslate from "~icons/material-symbols/translate"
import IconSettings from "~icons/material-symbols/settings-outline"
import IconDescription from "~icons/material-symbols/description-outline"
import { WarningIcon } from "./components/Notification/NotificationHint.jsx"
import { showToast } from "#src/interface/components/Toast.jsx"
import { isValidLanguageTag, type LanguageTag } from "@inlang/sdk"
import { sortLanguageTags } from "./helper/sortLanguageTags.js"
import EditorLayout from "#src/interface/editor/EditorLayout.jsx"
import Link from "#src/renderer/Link.jsx"
import { setSignInModalOpen } from "#src/services/auth/src/components/SignInDialog.jsx"
import { useLocalStorage } from "#src/services/local-storage/src/LocalStorageProvider.jsx"

interface Filter {
	name: string
	icon: JSXElement
	component: JSXElement
}

// command-f this repo to find where the layout is called
export function Layout(props: { children: JSXElement }) {
	const {
		refetchRepo,
		forkStatus,
		userIsCollaborator,
		project,
		lixErrors,
		setTextSearch,
		filteredMessageLintRules,
		setFilteredMessageLintRules,
		filteredLanguageTags,
		setFilteredLanguageTags,
		languageTags,
		currentBranch,
		activeProject,
		routeParams,
	} = useEditorState()

	const [localStorage, setLocalStorage] = useLocalStorage()

	const removeFilter = (filterName: string) => {
		setSelectedFilters(selectedFilters().filter((filter: Filter) => filter.name !== filterName))
	}

	const [forkStatusModalOpen, setForkStatusModalOpen] = createSignal(false)
	const [openedGitHub, setOpenedGitHub] = createSignal(false)

	createEffect(() => {
		if (
			forkStatus() &&
			forkStatus()?.behind > 0 &&
			forkStatus().conflicts &&
			userIsCollaborator()
		) {
			setForkStatusModalOpen(true)
		}
	})

	const [addLanguageModalOpen, setAddLanguageModalOpen] = createSignal(false)
	const [addLanguageText, setAddLanguageText] = createSignal("")

	const [filterOptions, setFilterOptions] = createSignal<Filter[]>([
		{
			name: "Language",
			icon: <IconTranslate class="w-5 h-5" />,
			component: (
				<LanguageFilter
					clearFunction={removeFilter("Language")}
					setAddLanguageModalOpen={setAddLanguageModalOpen}
				/>
			),
		},
	])

	const [selectedFilters, setSelectedFilters] = createSignal<Filter[]>([])

	const addFilter = (filterName: string) => {
		const newFilter = filterOptions().find((filter) => filter.name === filterName)
		// check if filter is in selectedFilters
		if (
			newFilter !== undefined &&
			!selectedFilters().some((filter) => filter.name === newFilter.name) &&
			(newFilter.name !== "Linting" || project()?.installed.messageLintRules())
		) {
			if (newFilter.name === "Language" && filteredLanguageTags().length === 0) {
				setFilteredLanguageTags(() => project()?.settings()?.languageTags || [])
			}
			setSelectedFilters([...selectedFilters(), newFilter])
		}
	}

	//add linting rule to filter
	createEffect(
		on(
			filteredMessageLintRules,
			(rules) => {
				if (rules.length === 1 && !selectedFilters().some((filter) => filter.name === "Linting")) {
					addFilter("Linting")
				}
			},
			{ defer: true }
		)
	)

	//add initial language filter
	createEffect(
		on(project, () => {
			if (lixErrors().length === 0 && project()) {
				addFilter("Language")
				if (filteredLanguageTags().length === 0 && project()!.settings())
					setFilteredLanguageTags(project()!.settings()!.languageTags)
			}
		})
	)

	//add initial lintRule filter
	createEffect(
		on(project, () => {
			// add filter option, if lintRules are installed
			if (project() && project()?.installed.messageLintRules().length !== 0) {
				setFilterOptions((prev: Filter[]) => [
					...prev,
					{
						name: "Linting",
						icon: <WarningIcon />,
						component: <LintFilter clearFunction={removeFilter("Linting")} />,
					},
				])
			}

			if (lixErrors().length === 0 && filteredMessageLintRules().length > 0) {
				addFilter("Linting")
			}
		})
	)

	const addLanguageTag = (languageTag: LanguageTag) => {
		if (languageTags().includes(languageTag)) {
			showToast({
				variant: "warning",
				title: "Language tag already exists",
				message:
					"This language tag is already present in this project. Please choose another name.",
			})
			return
		}
		setFilteredLanguageTags([...filteredLanguageTags(), languageTag])
		project()?.setSettings({
			...project()!.settings()!,
			languageTags: [...project()!.settings()!.languageTags, languageTag],
		})
	}

	const settingsLink = () => {
		if (currentBranch() && activeProject()) {
			return (
				(import.meta.env.PROD ? `https://manage.inlang.com/` : `http://localhost:4004/`) +
				`?repo=${`github.com/${routeParams().owner}/${
					routeParams().repository
				}`}&branch=${currentBranch()}&project=${activeProject()}`
			)
		} else {
			return (
				(import.meta.env.PROD ? `https://manage.inlang.com/` : `http://localhost:4004/`) +
				`?repo=${`github.com/${routeParams().owner}/${routeParams().repository}`}`
			)
		}
	}

	return (
		<EditorLayout>
			<div class="w-full flex flex-col grow bg-surface-50">
				<div class="w-full flex items-end justify-between z-20">
					<div class="flex flex-wrap gap-2 items-center pt-5">
						<Breadcrumbs />
						<BranchMenu />
						<ProjectMenu />
					</div>
					<sl-button
						slot="trigger"
						prop:size="small"
						prop:href={settingsLink()}
						prop:target="_blank"
					>
						{/* @ts-ignore */}
						<IconSettings slot="prefix" class="w-5 h-5 -ml-0.5" />
						Settings
					</sl-button>
				</div>
				<div class="flex flex-wrap justify-between gap-2 py-4 md:py-5 sticky top-[61px] z-10 bg-surface-50">
					<div class="flex flex-wrap z-20 gap-2 items-center">
						<Show when={project()}>
							<For each={filterOptions()}>
								{(filter) => (
									<Show
										when={
											selectedFilters().includes(filter) &&
											(filter.name !== "Linting" || project()?.installed.messageLintRules())
										}
									>
										{filter.component}
									</Show>
								)}
							</For>
							<Show
								when={
									project()?.installed.messageLintRules()
										? selectedFilters().length !== filterOptions().length
										: selectedFilters().length !== filterOptions().length - 1
								}
								fallback={
									<sl-button
										prop:size="small"
										onClick={() => {
											setFilteredLanguageTags(
												setFilteredLanguageTags(project()?.settings()?.languageTags || [])
											)
											setFilteredMessageLintRules([])
											setSelectedFilters([])
										}}
									>
										Clear
									</sl-button>
								}
							>
								<sl-dropdown prop:distance={8} class="animate-blendIn">
									<sl-button prop:size="small" slot="trigger">
										<button slot="prefix">
											<IconAdd class="w-5 h-5 -mx-0.5" />
										</button>
										Filter
									</sl-button>
									<sl-menu>
										<For each={filterOptions()}>
											{(filter) => (
												<Show
													when={
														!selectedFilters().includes(filter) &&
														(filter.name !== "Linting" || project()?.installed.messageLintRules())
													}
												>
													<sl-menu-item>
														<button
															onClick={() => {
																if (
																	filter.name === "Linting" &&
																	filteredMessageLintRules.length === 0
																) {
																	setFilteredMessageLintRules(
																		project()
																			?.installed.messageLintRules()
																			.map((lintRule) => lintRule.id) ?? []
																	)
																}
																addFilter(filter.name)
															}}
															class="flex gap-2 items-center w-full"
														>
															<div slot="prefix" class="-ml-2 mr-2">
																{filter.icon}
															</div>
															{filter.name}
														</button>
													</sl-menu-item>
												</Show>
											)}
										</For>
									</sl-menu>
								</sl-dropdown>
							</Show>
						</Show>
					</div>
					<div class="flex flex-wrap gap-2">
						<SearchInput
							placeholder="Search ..."
							handleChange={(text: string) => setTextSearch(text)}
						/>
					</div>
				</div>
				{props.children}
			</div>
			<sl-dialog
				prop:label="Add language tag"
				prop:open={addLanguageModalOpen()}
				on:sl-after-hide={() => setAddLanguageModalOpen(false)}
			>
				<p class="text-xs pb-4 -mt-4 pr-8">
					You can add a language to the ressource, by providing a unique tag. By doing that inlang
					is creating a new language file and commits it to the local repository instance.
				</p>
				<sl-input
					class="addLanguage p-0 border-0 focus:border-0 focus:outline-0 focus:ring-0"
					prop:size="small"
					prop:label="Tag"
					prop:placeholder={"Add a language tag"}
					prop:helpText={
						!(
							(!isValidLanguageTag(addLanguageText()) && addLanguageText().length > 0) ||
							project()?.settings().languageTags.includes(addLanguageText())
						)
							? "Unique tags for languages (e.g. -> en, de, fr)"
							: ""
					}
					prop:value={addLanguageText()}
					onPaste={(e) => setAddLanguageText(e.currentTarget.value)}
					onInput={(e) => setAddLanguageText(e.currentTarget.value)}
				/>
				<Show when={!isValidLanguageTag(addLanguageText()) && addLanguageText().length > 0}>
					<p class="text-xs leading-5 text-danger max-sm:hidden pt-1 pb-0.5">
						Please enter a valid{" "}
						<a
							href={
								import.meta.env.PROD
									? "https://inlang.com/documentation/concept/language-tag"
									: "http://localhost:3000/documentation/concept/language-tag"
							}
							target="_blank"
							class="underline"
						>
							BCP-47 language tag
						</a>{" "}
						(e.g. en, en-GB)
					</p>
				</Show>
				<Show when={project()?.settings().languageTags.includes(addLanguageText())}>
					<p class="text-xs leading-5 text-danger max-sm:hidden pt-1 pb-0.5">
						Language tag "{addLanguageText()}" already exists
					</p>
				</Show>
				<sl-button
					class="w-full pt-6"
					prop:size={"small"}
					prop:variant={"primary"}
					prop:disabled={
						!isValidLanguageTag(addLanguageText()) ||
						project()?.settings().languageTags.includes(addLanguageText())
					}
					onClick={() => {
						addLanguageTag(addLanguageText())
						setAddLanguageModalOpen(false)
					}}
				>
					Add language
				</sl-button>
			</sl-dialog>
			<sl-dialog
				prop:label="Fork out of sync"
				prop:open={forkStatusModalOpen()}
				on:sl-after-hide={() => setForkStatusModalOpen(false)}
			>
				<p class="text-sm pb-4 -mt-4 pr-8">
					Your fork is out of sync with the upstream repository. Please resolve the conflicts before
					applying your changes.
				</p>
				<img
					src="/images/resolve-in-github.webp"
					alt="Sync Fork GitHub UI"
					class="w-4/5 mx-auto mt-2"
				/>
				<sl-checkbox
					class="pt-4"
					prop:checked={localStorage.disableForkSyncWarning?.some(
						(repo) =>
							repo.owner === routeParams().owner && repo.repository === routeParams().repository
					)}
					on:sl-change={(event: { target: { checked: boolean } }) => {
						setLocalStorage({
							...localStorage,
							disableForkSyncWarning: event.target.checked
								? [
										...localStorage.disableForkSyncWarning,
										{ owner: routeParams().owner, repository: routeParams().repository },
								  ]
								: localStorage.disableForkSyncWarning.filter(
										(repo) =>
											!(
												repo.owner === routeParams().owner &&
												repo.repository === routeParams().repository
											)
								  ),
						})
					}}
				>
					Disable checking for updates in the upstream branch
				</sl-checkbox>
				<div class="flex flex-col gap-4 pt-6">
					<sl-button
						class="w-full"
						prop:variant={openedGitHub() ? "default" : "primary"}
						prop:href={`https://github.com/${routeParams().owner}/${routeParams().repository}`}
						prop:target="_blank"
						onClick={() => setOpenedGitHub(true)}
					>
						<div slot="prefix">
							<IconGithub />
						</div>
						Open GitHub
					</sl-button>
					<Show when={openedGitHub()}>
						<sl-button
							class="w-full"
							prop:variant={"primary"}
							onClick={() => {
								refetchRepo()
								setForkStatusModalOpen(false)
								setOpenedGitHub(false)
							}}
						>
							<div slot="prefix">
								<IconSync />
							</div>
							Reload repo
						</sl-button>
					</Show>
				</div>
			</sl-dialog>
			<Gitfloat />
		</EditorLayout>
	)
}
function Breadcrumbs() {
	const { routeParams } = useEditorState()
	return (
		<div class="flex flex-wrap flex-row items-center gap-2 text-lg font-medium">
			{/* repository icon */}
			<svg class="w-4 h-4" viewBox="0 0 16 16">
				<path
					fill="currentColor"
					fill-rule="evenodd"
					d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 1 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7a.75.75 0 0 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5v-9zm10.5-1V9h-8c-.356 0-.694.074-1 .208V2.5a1 1 0 0 1 1-1h8zM5 12.25v3.25a.25.25 0 0 0 .4.2l1.45-1.087a.25.25 0 0 1 .3 0L8.6 15.7a.25.25 0 0 0 .4-.2v-3.25a.25.25 0 0 0-.25-.25h-3.5a.25.25 0 0 0-.25.25z"
				/>
			</svg>
			<a
				href={`https://github.com/${routeParams().owner}`}
				target="_blank"
				class="link hover:text-primary break-all"
			>
				<h3>{routeParams().owner}</h3>
			</a>
			<h3>/</h3>
			<a
				href={`https://github.com/${routeParams().owner}/${routeParams().repository}`}
				target="_blank"
				class="link hover:text-primary break-all"
			>
				<h3>{routeParams().repository}</h3>
			</a>
		</div>
	)
}

/**
 * The menu to select the branch.
 */
function BranchMenu() {
	const { activeBranch, setActiveBranch, branchNames, currentBranch } = useEditorState()
	return (
		<sl-tooltip
			prop:content="Select branch"
			prop:placement="bottom"
			prop:trigger="hover"
			class="small"
			style={{ "--show-delay": "1s" }}
		>
			<sl-dropdown prop:distance={8}>
				<sl-button
					slot="trigger"
					prop:caret={true}
					prop:size="small"
					prop:loading={currentBranch() !== activeBranch() && activeBranch() !== undefined}
				>
					<div slot="prefix">
						{/* branch icon from github */}
						<svg class="w-4 h-4">
							<path
								fill="currentColor"
								fill-rule="evenodd"
								d="M11.75 2.5a.75.75 0 1 0 0 1.5a.75.75 0 0 0 0-1.5zm-2.25.75a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0 0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.492 2.492 0 0 1 6 7h4a1 1 0 0 0 1-1v-.628A2.25 2.25 0 0 1 9.5 3.25zM4.25 12a.75.75 0 1 0 0 1.5a.75.75 0 0 0 0-1.5zM3.5 3.25a.75.75 0 1 1 1.5 0a.75.75 0 0 1-1.5 0z"
							/>
						</svg>
					</div>
					{currentBranch() ?? "branch"}
				</sl-button>

				<sl-menu class="w-48 min-w-fit">
					<For each={branchNames()}>
						{(branch) => (
							<div onClick={() => setActiveBranch(branch)}>
								<sl-menu-item prop:type="checkbox" prop:checked={currentBranch() === branch}>
									{branch}
								</sl-menu-item>
							</div>
						)}
					</For>
				</sl-menu>
			</sl-dropdown>
		</sl-tooltip>
	)
}

/**
 * The menu to select the project.
 */
function ProjectMenu() {
	const { project, activeProject, setActiveProject, projectList, currentBranch, activeBranch } =
		useEditorState()

	const activeProjectName = () => {
		return (
			activeProject()?.toString().split("/").at(-2) +
			"/" +
			activeProject()?.toString().split("/").at(-1)
		)
	}

	return (
		<sl-tooltip
			prop:content="Select inlang project"
			prop:placement="bottom"
			prop:trigger="hover"
			class="small"
			style={{ "--show-delay": "1s" }}
		>
			<sl-dropdown prop:distance={8}>
				<sl-button
					slot="trigger"
					prop:caret={true}
					prop:size="small"
					prop:loading={
						(currentBranch() !== activeBranch() && activeBranch() !== undefined) || project.loading
					}
				>
					<div slot="prefix">
						<IconDescription class="-ml-1 w-5 h-5" />
					</div>
					{activeProject() ? activeProjectName() : "project"}
				</sl-button>

				<sl-menu class="w-48 min-w-fit">
					<For each={projectList()}>
						{(project) => (
							<div onClick={() => setActiveProject(project.projectPath)}>
								<sl-menu-item
									prop:type="checkbox"
									prop:checked={activeProject() === project.projectPath}
								>
									{project.projectPath}
								</sl-menu-item>
							</div>
						)}
					</For>
				</sl-menu>
			</sl-dropdown>
		</sl-tooltip>
	)
}

function LanguageFilter(props: { clearFunction: any; setAddLanguageModalOpen: Setter<boolean> }) {
	const { project, setFilteredLanguageTags, filteredLanguageTags, userIsCollaborator } =
		useEditorState()
	const [localStorage] = useLocalStorage()

	onMount(() => {
		if (filteredLanguageTags().length === 0 || filteredLanguageTags() === undefined) {
			setFilteredLanguageTags(() => project()?.settings()?.languageTags || [])
		}
	})

	return (
		<Show
			when={project()?.settings() && filteredLanguageTags() && filteredLanguageTags().length > 0}
		>
			<sl-select
				prop:name="Language Select"
				prop:placeholder="none"
				prop:size="small"
				prop:multiple={true}
				prop:clearable={true}
				prop:value={filteredLanguageTags()}
				on:sl-change={(event: any) => {
					setFilteredLanguageTags(event.target.value)
				}}
				on:sl-clear={() => {
					props.clearFunction
				}}
				class="filter border-0 focus:ring-background/100 p-0 m-0 text-sm animate-blendIn"
			>
				<div class="flex items-center gap-2 ml-1" slot="prefix">
					<p class="flex-grow-0 flex-shrink-0 text-sm font-medium text-left text-on-surface-variant">
						Language
					</p>
					<p class="flex-grow-0 flex-shrink-0 text-sm font-medium text-left text-on-surface-variant/60">
						is
					</p>
				</div>
				<button slot="clear-icon">
					<IconClose width={20} height={20} />
				</button>

				<div class="flex px-3 gap-2 text-sm font-medium">
					<span class="text-left text-outline-variant grow">Select</span>
					<sl-tooltip
						prop:content="Add language"
						prop:placement="bottom"
						prop:trigger="hover"
						class="small"
						style={{ "--show-delay": "1s" }}
					>
						<button
							class="link link-primary opacity-75"
							onClick={() => {
								if (!localStorage?.user?.isLoggedIn) {
									setSignInModalOpen(true)
								} else if (!userIsCollaborator()) {
									showToast({
										variant: "warning",
										title: "No access to this repo",
										message: "Use a fork to make changes.",
									})
								} else {
									props.setAddLanguageModalOpen(true)
								}
							}}
						>
							<IconAdd class="w-5 h-5" />
						</button>
					</sl-tooltip>
					<Link
						class="cursor-pointer link link-primary opacity-75"
						onClick={() => setFilteredLanguageTags(() => project()?.settings()?.languageTags || [])}
					>
						All
					</Link>
					<Link
						class="cursor-pointer link link-primary opacity-75"
						// filter all except the source language
						onClick={() =>
							setFilteredLanguageTags(
								// eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
								[project()?.settings()?.sourceLanguageTag!]
							)
						}
					>
						None
					</Link>
				</div>
				<sl-divider class="mt-2 mb-0 h-[1px] bg-surface-3" />
				<div class="max-h-[300px] overflow-y-auto text-sm">
					{/* eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain */}
					<For
						each={sortLanguageTags(
							project()?.settings()?.languageTags || [],
							project()?.settings()?.sourceLanguageTag || "en"
						)}
					>
						{(language) => (
							<sl-option
								prop:value={language}
								prop:selected={filteredLanguageTags().includes(language)}
								prop:disabled={language === project()?.settings()?.sourceLanguageTag}
								class={language === project()?.settings()?.sourceLanguageTag ? "opacity-50" : ""}
							>
								{language}
								{language === project()?.settings()?.sourceLanguageTag ? (
									<sl-badge prop:variant="neutral" class="relative translate-x-3">
										<span class="after:content-['ref'] after:text-background" />
									</sl-badge>
								) : (
									""
								)}
							</sl-option>
						)}
					</For>
				</div>
			</sl-select>
		</Show>
	)
}

function LintFilter(props: { clearFunction: any }) {
	const { project, filteredMessageLintRules, setFilteredMessageLintRules } = useEditorState()
	return (
		<sl-select
			prop:name="Lint Filter Select"
			prop:size="small"
			prop:multiple={true}
			prop:maxOptionsVisible={2}
			prop:clearable={true}
			prop:value={filteredMessageLintRules()}
			on:sl-change={(event: any) => {
				setFilteredMessageLintRules(event.target.value ?? [])
			}}
			on:sl-clear={() => {
				props.clearFunction
			}}
			class="filter border-0 focus:ring-background/100 p-0 m-0 text-sm animate-blendIn"
		>
			<div class={"flex items-center gap-2 ml-1 mr-0"} slot="prefix">
				<p class="flex-grow-0 flex-shrink-0 text-sm font-medium text-left text-on-surface-variant">
					Lint
				</p>
				<p class="flex-grow-0 flex-shrink-0 text-sm font-medium text-left text-on-surface-variant/60">
					is
				</p>
				<Show when={filteredMessageLintRules().length === 0} fallback={<div />}>
					<sl-tag prop:size="small" class="font-medium text-sm">
						everyMessage
					</sl-tag>
					<button
						class="hover:text-on-surface hover:bg-surface-variant rounded-sm"
						onClick={() => {
							setFilteredMessageLintRules([])
							props.clearFunction
						}}
					>
						<IconClose />
					</button>
				</Show>
			</div>
			<button slot="clear-icon" class="p-0.5">
				<IconClose class="w-4 h-4" />
			</button>

			<div class="flex px-3 gap-2 text-sm font-medium">
				<span class="text-left text-outline-variant grow">Select</span>
				<Link
					class="cursor-pointer link link-primary opacity-75"
					onClick={() =>
						setFilteredMessageLintRules(
							project()
								?.installed.messageLintRules()
								.map((lintRule) => lintRule.id) ?? []
						)
					}
				>
					All
				</Link>
				<Link
					class="cursor-pointer link link-primary opacity-75"
					onClick={() => setFilteredMessageLintRules([])}
				>
					None
				</Link>
			</div>
			<sl-divider class="mt-2 mb-0 h-[1px] bg-surface-3" />
			<div class="max-h-[300px] overflow-y-auto">
				<For
					each={
						project()
							?.installed.messageLintRules()
							.map((lintRule) => lintRule) ?? []
					}
				>
					{(lintRule) => (
						<sl-option prop:value={lintRule.id}>
							{typeof lintRule.displayName === "object"
								? lintRule.displayName.en
								: lintRule.displayName}
						</sl-option>
					)}
				</For>
			</div>
		</sl-select>
	)
}
