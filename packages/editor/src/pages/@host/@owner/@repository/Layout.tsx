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
import IconTag from "~icons/material-symbols/tag"
import IconBack from "~icons/material-symbols/arrow-back-ios-new"
import { WarningIcon } from "./components/Notification/NotificationHint.jsx"
import { ProjectSettings, type InlangProject } from "@inlang/sdk"
import { sortLanguageTags } from "./helper/sortLanguageTags.js"
import EditorLayout from "#src/interface/editor/EditorLayout.jsx"
import Link from "#src/renderer/Link.jsx"
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
		setLocalChanges,
		userIsCollaborator,
		project,
		refetchProject,
		setTextSearch,
		filteredMessageLintRules,
		setFilteredMessageLintRules,
		filteredLanguageTags,
		setFilteredLanguageTags,
		filteredIds,
		languageTags,
		routeParams,
		lastPullTime,
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

	// Settings modal related
	const [settingsOpen, setSettingsOpen] = createSignal(false)
	// eslint-disable-next-line solid/reactivity
	const [, setHasChanges] = createSignal(false)
	const [previousSettings, setPreviousSettings] = createSignal<ProjectSettings | undefined>()

	createEffect(on(lastPullTime, () => setPreviousSettings()))
	createEffect(
		on(project, () => {
			// set once after last pull and the project is loaded
			if (project && !previousSettings()) {
				setPreviousSettings(project()?.settings())
				setHasChanges(false)
			}
		})
	)

	const handleChanges = () =>
		setHasChanges((prev) => {
			const hasChanged =
				JSON.stringify(previousSettings()) !== JSON.stringify(project()?.settings())
			if (prev !== hasChanged && hasChanged && project() && previousSettings()) {
				setLocalChanges((prev) => (prev += 1))
			} else if (prev !== hasChanged && !hasChanged && project() && previousSettings()) {
				setLocalChanges((prev) => (prev -= 1))
			}
			// update language tags if they have changed
			if (previousSettings()?.languageTags !== languageTags()) {
				setFilteredLanguageTags(languageTags())
			}
			return hasChanged
		})

	const [runSettingsCloseAnimation, setRunSettingsCloseAnimation] = createSignal(false)
	const handleClose = () => {
		setRunSettingsCloseAnimation(true)
		setTimeout(() => {
			setSettingsOpen(false)
			setRunSettingsCloseAnimation(false)
		}, 380)
	}

	const [filterOptions] = createSignal<Filter[]>([
		{
			name: "Language",
			icon: <IconTranslate class="w-5 h-5" />,
			component: (
				<LanguageFilter
					clearFunction={removeFilter("Language")}
					setSettingsOpen={setSettingsOpen}
				/>
			),
		},
		{
			name: "Message Ids",
			icon: <IconTag class="w-5 h-5" />,
			component: <IdsFilter clearFunction={removeFilter("Message Ids")} />,
		},
		{
			name: "Linting",
			icon: <WarningIcon />,
			component: <LintFilter clearFunction={removeFilter("Linting")} />,
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
				setFilteredLanguageTags(languageTags())
			}
			setSelectedFilters([...selectedFilters(), newFilter])
		}
	}

	//add linting rule to filter options
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

	//add initial filter
	createEffect(
		on(project, () => {
			if (project()) {
				addFilter("Language")
				if (filteredLanguageTags().length === 0 && project()!.settings())
					setFilteredLanguageTags(languageTags())
				if (filteredIds().length > 0) {
					addFilter("Message Ids")
				}
				if (filteredMessageLintRules().length > 0) {
					addFilter("Linting")
				}
			}
		})
	)

	return (
		<EditorLayout>
			<div class="w-full flex flex-col grow bg-surface-50">
				<div class="w-full flex items-end justify-between z-20 gap-2 pt-4">
					<div class="flex flex-wrap gap-2 items-center">
						<Breadcrumbs />
						<div class="flex gap-2">
							<BranchMenu />
							<ProjectMenu />
						</div>
					</div>
					<sl-button
						slot="trigger"
						prop:size="small"
						prop:disabled={userIsCollaborator() !== true}
						onClick={() => setSettingsOpen(!settingsOpen())}
					>
						{/* @ts-ignore */}
						<IconSettings slot="prefix" class="w-5 h-5 -ml-0.5" />
						Settings
					</sl-button>
				</div>
				<Show
					when={
						settingsOpen() &&
						project()?.settings() &&
						project()?.installed.plugins() &&
						project()?.installed.messageLintRules()
					}
				>
					<div
						class={
							"requires-no-scroll absolute left-0 overflow-y-scroll h-[calc(100vh_-_61px)] w-screen mx-auto z-50 bg-surface-50 " +
							(runSettingsCloseAnimation() ? "animate-fadeOutBottom" : "animate-fadeInBottom")
						}
					>
						<div class="relative w-full max-w-7xl mx-auto px-4 lg:pt-12">
							<sl-button
								class="hidden lg:inline-flex lg:sticky lg:top-4"
								onClick={() => handleClose()}
							>
								{/* @ts-ignore */}
								<IconBack slot="prefix" />
								Back
							</sl-button>
							<div class="max-w-screen-sm mx-auto">
								<div class="flex sticky lg:hidden items-center justify-between gap-2 pt-4 pb-8 top-0 z-10 bg-gradient-to-b from-surface-50 from-80% to-transparent to-100%">
									<h1 class="text-2xl">Settings</h1>
									<sl-button onClick={() => handleClose()} prop:size="small">
										{/* @ts-ignore */}
										<IconClose slot="prefix" />
									</sl-button>
								</div>
								<h1 class="hidden lg:block text-2xl -mt-8 mb-8">Settings</h1>
								<inlang-settings
									prop:settings={project()!.settings() as ReturnType<InlangProject["settings"]>}
									prop:installedPlugins={
										project()?.installed.plugins() as ReturnType<
											InlangProject["installed"]["plugins"]
										>
									}
									prop:installedMessageLintRules={
										project()?.installed.messageLintRules() as ReturnType<
											InlangProject["installed"]["messageLintRules"]
										>
									}
									on:set-settings={(event: CustomEvent) => {
										const _project = project()
										if (_project) {
											_project.setSettings(event.detail.argument)
											refetchProject()
											handleChanges()
										} else {
											throw new Error("Settings can not be set, because project is not defined")
										}
									}}
								/>
							</div>
						</div>
					</div>
				</Show>
				<div class="flex flex-wrap justify-between gap-2 py-4 sticky top-[61px] z-10 bg-surface-50">
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
											setFilteredLanguageTags(languageTags())
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
			{/* Fork Status modal */}
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
	const { activeBranch, setActiveBranch, setBranchListEnabled, branchList, currentBranch } =
		useEditorState()
	return (
		<sl-tooltip
			prop:content="Select branch"
			prop:placement="bottom"
			prop:trigger="hover"
			class="small"
			style={{ "--show-delay": "1s" }}
		>
			<sl-dropdown prop:distance={8} on:sl-show={() => setBranchListEnabled(true)}>
				<sl-button
					slot="trigger"
					prop:caret={true}
					prop:size="small"
					prop:loading={
						(currentBranch() !== activeBranch() && activeBranch() !== undefined) ||
						(branchList.loading && !branchList())
					}
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
					<Show
						when={branchList()}
						fallback={<sl-menu-item prop:disabled={true}>Loading...</sl-menu-item>}
					>
						<For each={branchList()}>
							{(branch) => (
								<div
									onClick={() => {
										setActiveBranch(branch)
										setBranchListEnabled(false) // prevent refetching after selecting branch
									}}
								>
									<sl-menu-item prop:type="checkbox" prop:checked={currentBranch() === branch}>
										{branch}
									</sl-menu-item>
								</div>
							)}
						</For>
					</Show>
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

	const shortenProjectName = (projectPath: string) => {
		const projectPathArray = projectPath.split("/")
		if (projectPathArray.length > 3) {
			return (
				"/" +
				projectPathArray.at(-3) +
				"/" +
				projectPathArray.at(-2) +
				"/" +
				projectPathArray.at(-1)
			)
		}
		return projectPath
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
									{shortenProjectName(project.projectPath)}
								</sl-menu-item>
							</div>
						)}
					</For>
				</sl-menu>
			</sl-dropdown>
		</sl-tooltip>
	)
}

function LanguageFilter(props: { clearFunction: any; setSettingsOpen: Setter<boolean> }) {
	const {
		setFilteredLanguageTags,
		filteredLanguageTags,
		userIsCollaborator,
		languageTags,
		sourceLanguageTag,
	} = useEditorState()
	const [localStorage] = useLocalStorage()

	onMount(() => {
		if (filteredLanguageTags().length === 0 || filteredLanguageTags() === undefined) {
			setFilteredLanguageTags(languageTags())
		}
	})

	return (
		<Show
			when={
				languageTags().length !== 0 && filteredLanguageTags() && filteredLanguageTags().length > 0
			}
		>
			<sl-select
				prop:name="Language Select"
				prop:placeholder="none"
				prop:size="small"
				prop:multiple={true}
				prop:clearable={true}
				prop:value={filteredLanguageTags()}
				on:sl-change={(event: any) => {
					if (event.target.value.includes("add-language")) {
						props.setSettingsOpen(true)
						event.target.value = event.target.value.filter(
							(value: string) => value !== "add-language"
						)
					}
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
					<Link
						class="cursor-pointer link link-primary opacity-75"
						onClick={() => setFilteredLanguageTags(languageTags())}
					>
						All
					</Link>
					<Link
						class="cursor-pointer link link-primary opacity-75"
						// filter all except the source language
						onClick={() => setFilteredLanguageTags([sourceLanguageTag()])}
					>
						None
					</Link>
				</div>
				<sl-divider class="mt-2 mb-0 h-[1px] bg-surface-3" />
				<div class="max-h-[300px] overflow-y-auto text-sm">
					{/* eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain */}
					<For each={sortLanguageTags(languageTags(), sourceLanguageTag())}>
						{(language) => (
							<sl-option
								prop:value={language}
								prop:selected={filteredLanguageTags().includes(language)}
								prop:disabled={language === sourceLanguageTag()}
								class={language === sourceLanguageTag() ? "opacity-50" : ""}
							>
								{language}
								{language === sourceLanguageTag() ? (
									<sl-badge prop:variant="neutral" class="relative translate-x-3">
										<span class="after:content-['ref'] after:text-background" />
									</sl-badge>
								) : (
									""
								)}
							</sl-option>
						)}
					</For>
					<Show when={localStorage?.user?.isLoggedIn && userIsCollaborator()}>
						<sl-option class="add-language" prop:value="add-language">
							<IconAdd class="-ml-0.5 mr-3" /> Add a new language
						</sl-option>
					</Show>
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
						not selected
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

function IdsFilter(props: { clearFunction: any }) {
	const { project, filteredIds, setFilteredIds } = useEditorState()
	return (
		<sl-select
			prop:name="Ids Filter Select"
			prop:size="small"
			prop:multiple={true}
			prop:clearable={true}
			prop:value={filteredIds()}
			on:sl-change={(event: any) => {
				setFilteredIds(event.target.value ?? [])
			}}
			on:sl-clear={() => {
				props.clearFunction
			}}
			class="ids-filter filter border-0 focus:ring-background/100 p-0 m-0 text-sm animate-blendIn"
		>
			<div class={"flex items-center gap-2 ml-1 mr-0"} slot="prefix">
				<p class="flex-grow-0 flex-shrink-0 text-sm font-medium text-left text-on-surface-variant">
					Id
				</p>
				<p class="flex-grow-0 flex-shrink-0 text-sm font-medium text-left text-on-surface-variant/60">
					is
				</p>
				<Show
					when={filteredIds().length === 0}
					fallback={
						<div class="flex gap-1">
							<sl-tag slot="label" prop:size="small" class="font-medium text-sm">
								{filteredIds()[0]}
							</sl-tag>
							<Show when={filteredIds().length > 1}>
								<sl-tag slot="label" prop:size="small" class="font-medium text-sm">
									+{filteredIds().length - 1}
								</sl-tag>
							</Show>
						</div>
					}
				>
					<sl-tag prop:size="small" class="font-medium text-sm">
						not selected
					</sl-tag>
					<button
						class="hover:text-on-surface hover:bg-surface-variant rounded-sm ml-1 mr-0.5"
						onClick={() => {
							setFilteredIds(setFilteredIds(project()?.query.messages.includedMessageIds() ?? []))
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
					onClick={() => setFilteredIds(project()?.query.messages.includedMessageIds() ?? [])}
				>
					All
				</Link>
				<Link
					class="cursor-pointer link link-primary opacity-75"
					onClick={() => setFilteredIds([])}
				>
					None
				</Link>
			</div>
			<sl-divider class="mt-2 mb-0 h-[1px] bg-surface-3" />
			<div class="max-h-[300px] max-w-[300px]">
				<For each={project()?.query.messages.includedMessageIds() ?? []}>
					{(id) => (
						<sl-tooltip
							prop:content={id}
							prop:placement="top"
							prop:trigger="hover"
							prop:disabled={id.length < 28}
							class="ids-filter small overflow-hidden"
							style={{ "--show-delay": "1s", "--max-width": "260px", "word-break": "break-all" }}
						>
							<sl-option prop:value={id} class="ids-filter">
								{id}
							</sl-option>
						</sl-tooltip>
					)}
				</For>
			</div>
		</sl-select>
	)
}
