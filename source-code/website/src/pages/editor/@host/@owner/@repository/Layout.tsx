import { createEffect, createSignal, For, JSXElement, onCleanup, onMount, Show } from "solid-js"
import { useEditorState } from "./State.jsx"
import { Layout as RootLayout } from "@src/pages/Layout.jsx"
import { SearchInput } from "./components/SearchInput.jsx"
import { CustomHintWrapper } from "./components/Notification/CustomHintWrapper.jsx"
import { Gitfloat } from "./components/Gitfloat.jsx"
import IconAdd from "~icons/material-symbols/add"
import IconClose from "~icons/material-symbols/close"
import IconTranslate from "~icons/material-symbols/translate"
import { WarningIcon } from "./components/Notification/NotificationHint.jsx"

interface Filter {
	name: string
	icon: JSXElement
	component: JSXElement
}

// command-f this repo to find where the layout is called
export function Layout(props: { children: JSXElement }) {
	const {
		inlangConfig,
		setTextSearch,
		filteredLintRules,
		setFilteredLintRules,
		setFilteredLanguages,
	} = useEditorState()
	const [showLanguageFilterTooltip, setShowLanguageFilterTooltip] = createSignal(false)

	const onlyLanguagesTheUserSpeaks = () => {
		const languages = inlangConfig()?.languages.filter(
			(language) =>
				navigator.languages.includes(language) || language === inlangConfig()!.referenceLanguage,
		)
		return languages ?? []
	}

	const handleSearchText = (text: string) => {
		setTextSearch(text)
	}
	const filters: Filter[] = [
		{
			name: "Language",
			icon: () => <IconTranslate class="w-5 h-5" />,
			component: () => <LanguageFilter clearFunction={removeFilter("Language")} />,
		},
		{
			name: "Linting",
			icon: () => <WarningIcon />,
			component: () => <LintFilter clearFunction={removeFilter("Linting")} />,
		},
	]
	const [selectedFilters, setSelectedFilters] = createSignal<Filter[]>([])

	const addFilter = (filterName: string) => {
		const newFilter = filters.find((filter) => filter.name === filterName)
		if (newFilter !== undefined) {
			setSelectedFilters([...selectedFilters(), newFilter])
		}
	}

	const removeFilter = (filterName: string) => {
		setSelectedFilters(selectedFilters().filter((filter: Filter) => filter.name !== filterName))
	}

	//add linting rule to filter
	createEffect(() => {
		if (
			filteredLintRules().length !== 0 &&
			!selectedFilters().some((filter) => filter.name === "Linting")
		) {
			addFilter("Linting")
		}
	})

	//add initial language filter
	let hasExecuted = false
	createEffect(() => {
		if (!hasExecuted && onlyLanguagesTheUserSpeaks().length > 1) {
			setFilteredLanguages(onlyLanguagesTheUserSpeaks())
			addFilter("Language")
			setShowLanguageFilterTooltip(true)
			hasExecuted = true
		}
	})

	createEffect(() => {
		if (showLanguageFilterTooltip()) {
			const timerShow = setTimeout(() => {
				setShowLanguageFilterTooltip(true)
			}, 500)
			const timerHide = setTimeout(() => {
				setShowLanguageFilterTooltip(false)
			}, 5000)
			onCleanup(() => {
				clearTimeout(timerShow)
				clearTimeout(timerHide)
			})
		}
	})

	return (
		<RootLayout>
			<div class="pt-4 w-full flex flex-col grow">
				<div class="flex items-center space-x-4 pt-5">
					<Breadcrumbs />
					<BranchMenu />
				</div>
				<div class="flex justify-between gap-2 py-5 sticky top-[72px] z-30 bg-background">
					<div class="absolute -left-2 w-[calc(100%_+_16px)] h-full -translate-y-5 bg-background" />
					<div class="flex z-20 justify-between gap-2 items-center">
						<Show when={inlangConfig()}>
							<CustomHintWrapper
								notification={{
									notificationTitle: "Language detection",
									notificationDescription: "We filtered by your browser defaults.",
									notificationType: "info",
								}}
								condition={showLanguageFilterTooltip()}
							/>
							<For each={filters}>
								{(filter) => (
									<Show
										when={
											selectedFilters().includes(filter) &&
											(filter.name !== "Linting" || inlangConfig()?.lint?.rules)
										}
									>
										{filter.component}
									</Show>
								)}
							</For>
							<Show
								when={selectedFilters().length !== filters.length}
								fallback={
									<sl-button
										prop:size="small"
										onClick={() => {
											setFilteredLanguages(setFilteredLanguages(() => inlangConfig()!.languages))
											setFilteredLintRules([])
											setSelectedFilters([])
										}}
									>
										Clear
									</sl-button>
								}
							>
								<sl-dropdown prop:distance={8}>
									<sl-button prop:size="small" slot="trigger">
										<IconAdd slot="prefix" />
										Filter
									</sl-button>
									<sl-menu>
										<For each={filters}>
											{(filter) => (
												<Show when={!selectedFilters().includes(filter)}>
													<sl-menu-item>
														<button
															onClick={() => addFilter(filter.name)}
															class="flex gap-2 items-center"
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
					<div class="flex gap-2">
						<SearchInput placeholder="Search ..." handleChange={handleSearchText} />
					</div>
				</div>
				{/* <hr class="h-px w-full bg-outline-variant my-2"> </hr> */}
				{props.children}
			</div>
			<Gitfloat />
		</RootLayout>
	)
}
function Breadcrumbs() {
	const { routeParams } = useEditorState()
	return (
		<div class="flex flex-row items-center space-x-2 text-lg font-medium">
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
				class="link hover:text-primary"
			>
				<h3>{routeParams().owner}</h3>
			</a>
			<h3>/</h3>
			<a
				href={`https://github.com/${routeParams().owner}/${routeParams().repository}`}
				target="_blank"
				class="link hover:text-primary"
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
	const { currentBranch } = useEditorState()

	return (
		<sl-dropdown>
			<sl-button slot="trigger" prop:caret={true} prop:size="small">
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
			<sl-menu class="w-48 min-w-full">
				<div class="p-4">
					Branches are not implemented yet. Discussion is on going in{" "}
					<a
						href="https://github.com/inlang/inlang/discussions/166"
						class="link link-primary"
						target="blank"
					>
						#166
					</a>
					.
				</div>
				{/* <For each={branches()}>
					{(branch) => (
						<a
						href={`${currentPageContext().urlParsed.pathname}?branch=${branch}`}
						>
						<sl-menu-item prop:checked={currentBranch() === branch}>
						{branch}
						</sl-menu-item>
						</a>
						)}
					</For> */}
			</sl-menu>
		</sl-dropdown>
	)
}

function LanguageFilter(props: { clearFunction: any }) {
	const { inlangConfig, setFilteredLanguages, filteredLanguages } = useEditorState()

	onMount(() => {
		if (filteredLanguages().length === 0 || filteredLanguages() === undefined) {
			setFilteredLanguages(() => inlangConfig()!.languages)
		}
	})

	return (
		<Show
			when={inlangConfig() && filteredLanguages() && filteredLanguages().length > 0}
			fallback={
				<sl-select
					prop:name="Language Select"
					prop:placeholder="Loading ..."
					prop:size="small"
					class="border-0 focus:ring-background/100 p-0 m-0 text-sm"
				/>
			}
		>
			<sl-select
				prop:name="Language Select"
				prop:placeholder="none"
				prop:size="small"
				prop:multiple={true}
				prop:clearable={true}
				prop:value={filteredLanguages()}
				on:sl-change={(event: any) => {
					setFilteredLanguages(event.target.value)
				}}
				on:sl-clear={() => {
					setFilteredLanguages(() => inlangConfig()!.languages)
					props.clearFunction
				}}
				class="border-0 focus:ring-background/100 p-0 m-0 text-sm"
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
					<IconClose />
				</button>
				<div class="flex px-3 gap-2 text-xs font-medium tracking-wide">
					<span class="text-left text-on-surface-variant grow">Languages</span>
					<a
						class="cursor-pointer link link-primary"
						onClick={() => setFilteredLanguages(() => inlangConfig()!.languages)}
					>
						ALL
					</a>
					<a
						class="cursor-pointer link link-primary"
						// filter all except the reference language
						onClick={() => setFilteredLanguages([inlangConfig()!.referenceLanguage])}
					>
						NONE
					</a>
				</div>
				<sl-divider class="mt-2 mb-0 h-[1px] bg-surface-3" />
				<div class="max-h-[300px] overflow-y-auto">
					<For each={inlangConfig()?.languages}>
						{(language) => (
							<sl-option
								prop:value={language}
								prop:selected={filteredLanguages().includes(language)}
								prop:disabled={language === inlangConfig()?.referenceLanguage}
								class={language === inlangConfig()?.referenceLanguage ? "opacity-50" : ""}
							>
								{language}
								{language === inlangConfig()?.referenceLanguage ? (
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
	const { inlangConfig, filteredLintRules, setFilteredLintRules } = useEditorState()

	const lintRuleIds = () =>
		inlangConfig()
			?.lint?.rules?.flat()
			.map((rule) => rule.id) ?? []

	// onMount(() => {
	// 	console.log("Mount LintFilter")
	// 	if (filteredLintRules().length === 0 || filteredLintRules() === undefined) {
	// 		setFilteredLintRules(lintRuleIds())
	// 	}
	// })

	return (
		// <Show when={filteredLintRules() && filteredLintRules().length > 0}>
		<sl-select
			prop:name="Lint Filter Select"
			prop:size="small"
			prop:multiple={true}
			prop:maxOptionsVisible={2}
			prop:clearable={true}
			prop:value={filteredLintRules()}
			on:sl-change={(event: any) => {
				setFilteredLintRules(event.target.value ?? [])
			}}
			on:sl-clear={() => {
				setFilteredLintRules([])
				props.clearFunction
			}}
			class="border-0 focus:ring-background/100 p-0 m-0 text-sm"
		>
			<div class={"flex items-center gap-2 ml-1 mr-0"} slot="prefix">
				<p class="flex-grow-0 flex-shrink-0 text-sm font-medium text-left text-on-surface-variant">
					Linting
				</p>
				<p class="flex-grow-0 flex-shrink-0 text-sm font-medium text-left text-on-surface-variant/60">
					is
				</p>
				<Show when={filteredLintRules().length <= 0} fallback={<div />}>
					<sl-tag prop:size="small" class="font-medium text-sm">
						everyMessage
					</sl-tag>
					<button
						class="hover:text-on-surface hover:bg-surface-variant rounded-sm"
						onClick={() => {
							setFilteredLintRules([])
							props.clearFunction
						}}
					>
						<IconClose />
					</button>
				</Show>
			</div>
			<button slot="clear-icon">
				<IconClose />
			</button>

			<div class="flex px-3 gap-2 text-xs font-medium tracking-wide">
				<span class="text-left text-on-surface-variant grow">Lints</span>
				<a
					class="cursor-pointer link link-primary"
					onClick={() => setFilteredLintRules(lintRuleIds().map((id) => id))}
				>
					ALL
				</a>
				<a class="cursor-pointer link link-primary" onClick={() => setFilteredLintRules([])}>
					NONE
				</a>
			</div>
			<sl-divider class="mt-2 mb-0 h-[1px] bg-surface-3" />
			<div class="max-h-[300px] overflow-y-auto">
				<For each={lintRuleIds()}>
					{(id) => (
						<sl-option prop:value={id}>{id.includes(".") ? id.split(".")[1] : id}</sl-option>
					)}
				</For>
			</div>
		</sl-select>
		// </Show>
	)
}
