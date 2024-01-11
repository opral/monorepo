import { createEffect, createSignal, For, type JSXElement, on, onMount, Show } from "solid-js"
import { useEditorState } from "./State.jsx"
import { SearchInput } from "./components/SearchInput.jsx"
import { Gitfloat } from "./components/Gitfloat.jsx"
import IconAdd from "~icons/material-symbols/add"
import IconClose from "~icons/material-symbols/close"
import IconTranslate from "~icons/material-symbols/translate"
import IconDescription from "~icons/material-symbols/description-outline"
import { WarningIcon } from "./components/Notification/NotificationHint.jsx"
import { showToast } from "#src/interface/components/Toast.jsx"
import type { LanguageTag } from "@inlang/sdk"
import { sortLanguageTags } from "./helper/sortLanguageTags.js"
import EditorLayout from "#src/interface/editor/EditorLayout.jsx"
import Link from "#src/renderer/Link.jsx"
import { setSignInModalOpen } from "#src/services/auth/src/components/SignInDialog.jsx"

interface Filter {
	name: string
	icon: JSXElement
	component: JSXElement
}

// command-f this repo to find where the layout is called
export function Layout(props: { children: JSXElement }) {
	const {
		project,
		lixErrors,
		setTextSearch,
		filteredMessageLintRules,
		setFilteredMessageLintRules,
		filteredLanguageTags,
		setFilteredLanguageTags,
		userIsCollaborator,
		languageTags,
		currentBranch,
		activeProject,
		routeParams,
	} = useEditorState()

	const removeFilter = (filterName: string) => {
		setSelectedFilters(selectedFilters().filter((filter: Filter) => filter.name !== filterName))
	}

	const [addLanguageModalOpen, setAddLanguageModalOpen] = createSignal(false)
	const [addLanguageText, setAddLanguageText] = createSignal("")

	// check if the type matches the LanguageTag type
	const isValidLanguageTag = (): boolean => {
		const languageTagRegex =
			/^((?<grandfathered>(en-GB-oed|i-ami|i-bnn|i-default|i-enochian|i-hak|i-klingon|i-lux|i-mingo|i-navajo|i-pwn|i-tao|i-tay|i-tsu|sgn-BE-FR|sgn-BE-NL|sgn-CH-DE)|(art-lojban|cel-gaulish|no-bok|no-nyn|zh-guoyu|zh-hakka|zh-min|zh-min-nan|zh-xiang))|((?<language>([A-Za-z]{2,3}(-(?<extlang>[A-Za-z]{3}(-[A-Za-z]{3}){0,2}))?))(-(?<script>[A-Za-z]{4}))?(-(?<region>[A-Za-z]{2}|[0-9]{3}))?(-(?<variant>[A-Za-z0-9]{5,8}|[0-9][A-Za-z0-9]{3}))*))$/
		return languageTagRegex.test(addLanguageText())
	}

	const [filterOptions, setFilterOptions] = createSignal<Filter[]>([
		{
			name: "Language",
			icon: <IconTranslate class="w-5 h-5" />,
			component: <LanguageFilter clearFunction={removeFilter("Language")} />,
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
				if (filteredLanguageTags().length > 0) {
					addFilter("Language")
				} else {
					if (project()!.settings()) setFilteredLanguageTags(project()!.settings()!.languageTags)
				}
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
			return `https://manage.inlang.com/?repo=${`github.com/${routeParams().owner}/${
				routeParams().repository
			}`}&branch=${currentBranch()}&project=${activeProject()}`
		} else {
			return `https://manage.inlang.com/?repo=${`github.com/${routeParams().owner}/${
				routeParams().repository
			}`}`
		}
	}

	return (
		<EditorLayout>
			<div class="w-full flex flex-col grow bg-surface-50">
				<div class="w-full flex items-end justify-between">
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
						<div slot="prefix">
							<svg
								width="16"
								height="16"
								class="w-4 h-4"
								viewBox="0 0 16 16"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									d="M7.99977 5.33301C8.70701 5.33301 9.38529 5.61396 9.88538 6.11406C10.3855 6.61415 10.6664 7.29243 10.6664 7.99967C10.6664 8.70692 10.3855 9.3852 9.88538 9.88529C9.38529 10.3854 8.70701 10.6663 7.99977 10.6663C7.29252 10.6663 6.61424 10.3854 6.11415 9.88529C5.61405 9.3852 5.3331 8.70692 5.3331 7.99967C5.3331 7.29243 5.61405 6.61415 6.11415 6.11406C6.61424 5.61396 7.29252 5.33301 7.99977 5.33301ZM7.99977 6.66634C7.64614 6.66634 7.30701 6.80682 7.05696 7.05687C6.80691 7.30691 6.66643 7.64605 6.66643 7.99967C6.66643 8.3533 6.80691 8.69243 7.05696 8.94248C7.30701 9.19253 7.64614 9.33301 7.99977 9.33301C8.35339 9.33301 8.69253 9.19253 8.94257 8.94248C9.19262 8.69243 9.3331 8.3533 9.3331 7.99967C9.3331 7.64605 9.19262 7.30691 8.94257 7.05687C8.69253 6.80682 8.35339 6.66634 7.99977 6.66634ZM6.66643 14.6663C6.49977 14.6663 6.35977 14.5463 6.3331 14.3863L6.08643 12.6197C5.66643 12.453 5.30643 12.2263 4.95977 11.9597L3.29977 12.633C3.1531 12.6863 2.9731 12.633 2.8931 12.4863L1.55977 10.1797C1.51896 10.111 1.50458 10.0298 1.5193 9.95125C1.53403 9.87273 1.57685 9.80225 1.63977 9.75301L3.04643 8.64634L2.99977 7.99967L3.04643 7.33301L1.63977 6.24634C1.57685 6.1971 1.53403 6.12662 1.5193 6.04809C1.50458 5.96957 1.51896 5.88837 1.55977 5.81967L2.8931 3.51301C2.9731 3.36634 3.1531 3.30634 3.29977 3.36634L4.95977 4.03301C5.30643 3.77301 5.66643 3.54634 6.08643 3.37967L6.3331 1.61301C6.35977 1.45301 6.49977 1.33301 6.66643 1.33301H9.3331C9.49977 1.33301 9.63977 1.45301 9.66643 1.61301L9.9131 3.37967C10.3331 3.54634 10.6931 3.77301 11.0398 4.03301L12.6998 3.36634C12.8464 3.30634 13.0264 3.36634 13.1064 3.51301L14.4398 5.81967C14.5264 5.96634 14.4864 6.14634 14.3598 6.24634L12.9531 7.33301L12.9998 7.99967L12.9531 8.66634L14.3598 9.75301C14.4864 9.85301 14.5264 10.033 14.4398 10.1797L13.1064 12.4863C13.0264 12.633 12.8464 12.693 12.6998 12.633L11.0398 11.9663C10.6931 12.2263 10.3331 12.453 9.9131 12.6197L9.66643 14.3863C9.63977 14.5463 9.49977 14.6663 9.3331 14.6663H6.66643ZM7.49977 2.66634L7.2531 4.40634C6.4531 4.57301 5.74643 4.99967 5.2331 5.59301L3.62643 4.89967L3.12643 5.76634L4.5331 6.79967C4.26643 7.57745 4.26643 8.4219 4.5331 9.19967L3.11977 10.2397L3.61977 11.1063L5.23977 10.413C5.7531 10.9997 6.4531 11.4263 7.24643 11.5863L7.4931 13.333H8.50643L8.7531 11.593C9.54643 11.4263 10.2464 10.9997 10.7598 10.413L12.3798 11.1063L12.8798 10.2397L11.4664 9.20634C11.7331 8.42634 11.7331 7.57967 11.4664 6.79967L12.8731 5.76634L12.3731 4.89967L10.7664 5.59301C10.2426 4.98656 9.53199 4.57146 8.74643 4.41301L8.49977 2.66634H7.49977Z"
									fill="currentColor"
								/>
							</svg>
						</div>
						Settings
					</sl-button>
				</div>
				<div class="flex flex-wrap justify-between gap-2 py-5 sticky top-12 md:top-16 z-30 bg-surface-50">
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
								<sl-dropdown prop:distance={8}>
									<sl-button prop:size="small" slot="trigger">
										<button slot="prefix">
											<IconAdd class="w-4 h-4" />
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
						<sl-button
							prop:size={"small"}
							onClick={() => {
								if (localStorage?.user?.isLoggedIn === false) {
									setSignInModalOpen(true)
								} else if (userIsCollaborator() === false) {
									showToast({
										variant: "warning",
										title: "Not a collaborator",
										message:
											"Fork this repository to make changes.",
									})
								} else {
									setAddLanguageModalOpen(true)
								}
							}}
						>
							Add language tag
						</sl-button>
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
							(!isValidLanguageTag() && addLanguageText().length > 0) ||
							project()?.settings().languageTags.includes(addLanguageText())
						)
							? "Unique tags for languages (e.g. -> en, de, fr)"
							: ""
					}
					prop:value={addLanguageText()}
					onPaste={(e) => setAddLanguageText(e.currentTarget.value)}
					onInput={(e) => setAddLanguageText(e.currentTarget.value)}
				/>
				<Show when={!isValidLanguageTag() && addLanguageText().length > 0}>
					<p class="text-xs leading-5 text-danger max-sm:hidden pt-1 pb-0.5">
						Please enter a valid{" "}
						<a
							href="https://inlang.com/documentation/concept/language-tag"
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
						!isValidLanguageTag() || project()?.settings().languageTags.includes(addLanguageText())
					}
					onClick={() => {
						addLanguageTag(addLanguageText())
						setAddLanguageModalOpen(false)
					}}
				>
					Add language
				</sl-button>
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
			<Link
				href={`https://github.com/${routeParams().owner}`}
				target="_blank"
				class="link hover:text-primary break-all"
			>
				<h3>{routeParams().owner}</h3>
			</Link>
			<h3>/</h3>
			<Link
				href={`https://github.com/${routeParams().owner}/${routeParams().repository}`}
				target="_blank"
				class="link hover:text-primary break-all"
			>
				<h3>{routeParams().repository}</h3>
			</Link>
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
			prop:placement="top"
			prop:trigger="hover"
			prop:hoist={true}
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
			prop:placement="top"
			prop:trigger="hover"
			prop:hoist={true}
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

function LanguageFilter(props: { clearFunction: any }) {
	const { project, setFilteredLanguageTags, filteredLanguageTags } = useEditorState()

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
				class="filter border-0 focus:ring-background/100 p-0 m-0 text-sm"
			>
				<div class="flex items-center gap-2 ml-1" slot="prefix">
					<p class="flex-grow-0 flex-shrink-0 text-sm font-medium text-left text-on-surface-variant">
						Language
					</p>
					<p class="flex-grow-0 flex-shrink-0 text-sm font-medium text-left text-on-surface-variant/60">
						is
					</p>
				</div>
				<button slot="clear-icon" class="p-0.5">
					<IconClose class="w-4 h-4" />
				</button>

				<div class="flex px-3 gap-2 text-sm font-medium">
					<span class="text-left text-outline-variant grow">Select</span>
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
			class="filter border-0 focus:ring-background/100 p-0 m-0 text-sm"
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
