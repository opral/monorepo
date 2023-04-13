import { useEditorState } from "./State.jsx"
import { createEffect, createMemo, createSignal, For, JSXElement, onCleanup, Show } from "solid-js"
import { Layout as RootLayout } from "@src/pages/Layout.jsx"
import { SearchInput } from "./components/SearchInput.jsx"
import { CustomHintWrapper } from "./components/Notification/CustomHintWrapper.jsx"
import { WarningIcon } from "./components/Notification/NotificationHint.jsx"
import { publicEnv } from "@inlang/env-variables"

const [hasPushedChanges, setHasPushedChanges] = createSignal(false)

// command-f this repo to find where the layout is called
export function Layout(props: { children: JSXElement }) {
	const { inlangConfig } = useEditorState()
	const { setTextSearch } = useEditorState()
	const handleSearchText = (text: string) => {
		setTextSearch(text)
	}

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
							<p class="text-sm text-outline-variant">Filter:</p>
							<LanguageFilter />
							<Show when={inlangConfig()?.lint?.rules}>
								<sl-tooltip prop:content="by lint status">
									<StatusFilter />
								</sl-tooltip>
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

function LanguageFilter() {
	const { inlangConfig, setFilteredLanguages, filteredLanguages } = useEditorState()
	const [showLanguageFilterTooltip, setShowLanguageFilterTooltip] = createSignal(false)

	const onlyLanguagesTheUserSpeaks = () => {
		const languages = inlangConfig()?.languages.filter(
			(language) =>
				navigator.languages.includes(language) || language === inlangConfig()!.referenceLanguage,
		)
		return languages ?? []
	}

	onMount(() => {
		if (onlyLanguagesTheUserSpeaks().length > 1) {
			setFilteredLanguages(onlyLanguagesTheUserSpeaks())
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
		<CustomHintWrapper
			notification={{
				notificationTitle: "Language detection",
				notificationDescription: "We filtered by your browser defaults.",
				notificationType: "info",
			}}
			condition={showLanguageFilterTooltip()}
		>
			<sl-tooltip prop:content="by language">
				<Show
					when={inlangConfig()}
					fallback={
						<sl-select
							prop:name="Language Select"
							prop:placeholder="Loading ..."
							prop:size="small"
							class="border-0 focus:ring-background/100 p-0 m-0 text-sm"
						>
							<div class="mx-auto pr-2" slot="prefix">
								<LanguageIcon />
							</div>
						</sl-select>
					}
				>
					<sl-select
						prop:name="Language Select"
						prop:placeholder="Languages"
						prop:size="small"
						prop:multiple={true}
						prop:value={filteredLanguages()}
						on:sl-change={(event: any) => {
							setFilteredLanguages(event.target.value)
						}}
						class="border-0 focus:ring-background/100 p-0 m-0 text-sm"
					>
						<div class="mx-auto pr-2" slot="prefix">
							<LanguageIcon />
						</div>
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
			</sl-tooltip>
		</CustomHintWrapper>
	)
}

export const LanguageIcon = () => {
	return (
		<svg
			width="20"
			height="20"
			viewBox="0 0 20 20"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			class="flex-grow-0 flex-shrink-0 w-5 h-5 relative"
			preserveAspectRatio="none"
		>
			<path
				d="M18.6848 16.9375L15.1691 8.42188C15.1042 8.26462 14.9941 8.13017 14.8527 8.03556C14.7112 7.94096 14.5449 7.89046 14.3748 7.89046C14.2047 7.89046 14.0384 7.94096 13.897 8.03556C13.7555 8.13017 13.6454 8.26462 13.5805 8.42188L10.0648 16.9375C10.0211 17.0419 9.99848 17.154 9.99819 17.2672C9.99791 17.3804 10.02 17.4925 10.0632 17.5972C10.1064 17.7018 10.1698 17.7969 10.2499 17.877C10.3299 17.957 10.425 18.0205 10.5296 18.0637C10.6343 18.1069 10.7464 18.129 10.8596 18.1287C10.9728 18.1284 11.0849 18.1058 11.1893 18.0621C11.2938 18.0184 11.3885 17.9545 11.4682 17.874C11.5478 17.7936 11.6108 17.6982 11.6535 17.5934L12.3695 15.8594H16.3801L17.0961 17.5934C17.161 17.7507 17.2712 17.8852 17.4126 17.9799C17.5541 18.0745 17.7204 18.125 17.8906 18.125C18.0318 18.1249 18.1709 18.09 18.2954 18.0234C18.4199 17.9568 18.5261 17.8606 18.6046 17.7432C18.683 17.6258 18.7314 17.4909 18.7453 17.3503C18.7592 17.2098 18.7383 17.068 18.6844 16.9375H18.6848ZM13.0793 14.1406L14.375 11.002L15.6707 14.1406H13.0793ZM10.4625 13.3953C10.596 13.2109 10.6509 12.981 10.6151 12.7562C10.5793 12.5313 10.4557 12.3299 10.2715 12.1961C10.2637 12.1902 9.68555 11.7613 8.84609 10.8395C10.3949 8.74258 11.2723 6.35703 11.6301 5.23438H12.8906C13.1185 5.23438 13.3371 5.14383 13.4983 4.98267C13.6595 4.82151 13.75 4.60292 13.75 4.375C13.75 4.14708 13.6595 3.92849 13.4983 3.76733C13.3371 3.60617 13.1185 3.51562 12.8906 3.51562H8.35938V2.73438C8.35938 2.50645 8.26883 2.28787 8.10767 2.12671C7.94651 1.96554 7.72792 1.875 7.5 1.875C7.27208 1.875 7.05349 1.96554 6.89233 2.12671C6.73117 2.28787 6.64062 2.50645 6.64062 2.73438V3.51562H2.10938C1.88145 3.51562 1.66287 3.60617 1.50171 3.76733C1.34054 3.92849 1.25 4.14708 1.25 4.375C1.25 4.60292 1.34054 4.82151 1.50171 4.98267C1.66287 5.14383 1.88145 5.23438 2.10938 5.23438H9.81445C9.44258 6.28711 8.75781 7.94922 7.71328 9.46719C6.48633 7.83906 6.03047 6.78555 6.02695 6.77695C5.93713 6.56937 5.76909 6.40557 5.55928 6.32107C5.34947 6.23658 5.11481 6.23821 4.9062 6.3256C4.69758 6.413 4.53183 6.57911 4.44489 6.78792C4.35795 6.99673 4.35684 7.23139 4.4418 7.44102C4.46445 7.49492 5.01016 8.77813 6.50664 10.7195C6.54258 10.766 6.57812 10.8113 6.61367 10.8566C5.08086 12.5891 3.57695 13.6637 2.94766 14.0105C2.74755 14.1197 2.599 14.3039 2.53468 14.5225C2.47036 14.7412 2.49554 14.9765 2.60469 15.1766C2.71383 15.3767 2.89799 15.5252 3.11666 15.5895C3.33533 15.6539 3.5706 15.6287 3.7707 15.5195C3.85508 15.4734 5.66914 14.4691 7.74063 12.1762C8.62031 13.1168 9.225 13.5605 9.26133 13.5863C9.35273 13.6527 9.45633 13.7004 9.5662 13.7268C9.67606 13.7531 9.79004 13.7575 9.9016 13.7397C10.0132 13.7219 10.1201 13.6823 10.2164 13.6231C10.3126 13.564 10.3963 13.4864 10.4625 13.3949V13.3953Z"
				fill="#52525B"
			/>
		</svg>
	)
}

function StatusFilter() {
	const { inlangConfig, filteredStatus, setFilteredStatus } = useEditorState()
	const { inlangConfig, filteredStatus, setFilteredStatus } = useEditorState()

	const ids = createMemo(() => {
		return (
			inlangConfig()
				?.lint?.rules?.map((rule) => [rule].flat())
				.flat()
				.map(({ id }) => id) || []
		)
	})

	return (
		<sl-select
			prop:name="Lint Filter Select"
			prop:size="small"
			prop:multiple={true}
			prop:maxOptionsVisible={2}
			prop:value={filteredStatus()}
			on:sl-change={(event: any) => {
				setFilteredStatus(event.target.value)
			}}
			class="border-0 focus:ring-background/100 p-0 m-0 text-sm"
		>
			<div class="mx-auto flex items-center gap-2" slot="prefix">
				<div class="last:pr-2">
					<WarningIcon />
				</div>
				<Show when={filteredStatus().length <= 0}>
					<sl-tag prop:size="small" class="font-medium text-sm">
						everyMessage
					</sl-tag>
				</Show>
			</div>
		<sl-select
			prop:name="Lint Filter Select"
			prop:size="small"
			prop:multiple={true}
			prop:maxOptionsVisible={2}
			prop:value={filteredStatus()}
			on:sl-change={(event: any) => {
				setFilteredStatus(event.target.value)
			}}
			class="border-0 focus:ring-background/100 p-0 m-0 text-sm"
		>
			<div class="mx-auto flex items-center gap-2" slot="prefix">
				<div class="last:pr-2">
					<WarningIcon />
				</div>
				<Show when={filteredStatus().length <= 0}>
					<sl-tag prop:size="small" class="font-medium text-sm">
						everyMessage
					</sl-tag>
				</Show>
			</div>

			<div class="flex px-3 gap-2 text-xs font-medium tracking-wide">
				<span class="text-left text-on-surface-variant grow">Lints</span>
				<a
					class="cursor-pointer link link-primary"
					onClick={() => setFilteredStatus(ids().map((id) => id))}
				>
					ALL
				</a>
				<a
					class="cursor-pointer link link-primary"
					// filter all rules
					onClick={() => setFilteredStatus(() => [])}
				>
					NONE
				</a>
			</div>
			<sl-divider class="mt-2 mb-0 h-[1px] bg-surface-3" />
			<div class="max-h-[300px] overflow-y-auto">
				<For each={ids()}>{(id) => <sl-option prop:value={id}>{id.slice(7)}</sl-option>}</For>
			</div>
		</sl-select>
	)
}

function SignInBanner() {
	const { userIsCollaborator, githubRepositoryInformation, currentBranch, routeParams } =
		useEditorState()
	const [localStorage] = useLocalStorage()
	const [isLoading, setIsLoading] = createSignal(false)

	let alert: SlAlert | undefined

	createEffect(() => {
		// workaround for shoelace animation
		if (userIsCollaborator() === false) {
			setTimeout(() => {
				alert?.show()
			}, 50)
		} else {
			alert?.hide()
		}
	})

	let signInDialog: SlDialog | undefined

	function onSignIn() {
		signInDialog?.show()
	}

	async function handleFork() {
		setIsLoading(true)
		if (localStorage.user === undefined) {
			return
		}
		const response = await github.rest.repos.createFork({
			owner: routeParams().owner,
			repo: routeParams().repository,
		})
		telemetryBrowser.capture("fork created", {
			owner: routeParams().owner,
			repository: routeParams().repository,
			sucess: response.status === 202,
		})
		if (response.status === 202) {
			showToast({
				variant: "success",
				title: "The Fork has been created.",
				message: `Don't forget to open a pull request`,
			})
			setIsLoading(false)
			// full name is owner/repo
			return navigate(`/editor/github.com/${response.data.full_name}`)
		} else {
			showToast({
				variant: "danger",
				title: "The creation of the fork failed.",
				message: `Please try it again or report a bug`,
			})
			return response
		}
	}
	return (
		<>
			<Switch>
				<Match when={localStorage?.user === undefined}>
					<Banner
						variant="info"
						message="The repository has been cloned locally. You must sign in with your GitHub account to commit and push changes."
					>
						<sl-button onClick={onSignIn} prop:variant="primary">
							Sign in with GitHub
							<CibGithub slot="suffix" />
						</sl-button>
					</Banner>
				</Match>
				<Match
					when={
						userIsCollaborator.error === undefined &&
						userIsCollaborator.loading === false &&
						userIsCollaborator() === false &&
						localStorage?.user
					}
				>
					<Banner
						variant="info"
						message={`
            You do not have write access to ${routeParams().owner}/${
							routeParams().repository
						}. Fork this project to make changes.`}
					>
						<sl-button onClick={handleFork} prop:variant="primary" prop:loading={isLoading()}>
							<div slot="prefix">
								<svg width="1.2em" height="1.2em" viewBox="0 0 16 16">
									<path
										fill="currentColor"
										d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0a.75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5a.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0a.75.75 0 0 0 1.5 0Z"
									/>
								</svg>
							</div>
							Fork this project
						</sl-button>
					</Banner>
				</Match>
				<Match
					when={
						githubRepositoryInformation.error === undefined &&
						githubRepositoryInformation.loading === false &&
						hasPushedChanges() &&
						githubRepositoryInformation()?.data.fork
					}
				>
					<Banner
						variant="success"
						message={`You are working in a forked project. Please make a "pull request" to transfer your changes to the parent project:
							"${githubRepositoryInformation()?.data.parent?.full_name}"`}
					>
						<sl-button
							prop:target="_blank"
							prop:href={`https://github.com/${
								githubRepositoryInformation()?.data.parent?.full_name
							}/compare/${currentBranch()}...${githubRepositoryInformation()?.data.owner.login}:${
								githubRepositoryInformation()?.data.name
							}:${currentBranch()}?expand=1;title=Update%20translations;body=Describe%20the%20changes%20you%20have%20conducted%20here%0A%0APreview%20the%20messages%20on%20https%3A%2F%2Finlang.com%2Fgithub.com%2F${
								(currentPageContext.routeParams as EditorRouteParams).owner
							}%2F${(currentPageContext.routeParams as EditorRouteParams).repository}%20.`}
							prop:variant="success"
							// ugly workaround to close  the banner
							// after the button has been clicked
							onClick={() => {
								telemetryBrowser.capture("open pull request", {
									owner: routeParams().owner,
									repository: routeParams().repository,
								})
								setHasPushedChanges(false)
							}}
						>
							<div slot="prefix">
								<svg width="1em" height="1em" viewBox="0 0 24 24">
									<path
										fill="currentColor"
										d="M16 19.25a3.25 3.25 0 1 1 6.5 0a3.25 3.25 0 0 1-6.5 0Zm-14.5 0a3.25 3.25 0 1 1 6.5 0a3.25 3.25 0 0 1-6.5 0Zm0-14.5a3.25 3.25 0 1 1 6.5 0a3.25 3.25 0 0 1-6.5 0ZM4.75 3a1.75 1.75 0 1 0 .001 3.501A1.75 1.75 0 0 0 4.75 3Zm0 14.5a1.75 1.75 0 1 0 .001 3.501A1.75 1.75 0 0 0 4.75 17.5Zm14.5 0a1.75 1.75 0 1 0 .001 3.501a1.75 1.75 0 0 0-.001-3.501Z"
									/>
									<path
										fill="currentColor"
										d="M13.405 1.72a.75.75 0 0 1 0 1.06L12.185 4h4.065A3.75 3.75 0 0 1 20 7.75v8.75a.75.75 0 0 1-1.5 0V7.75a2.25 2.25 0 0 0-2.25-2.25h-4.064l1.22 1.22a.75.75 0 0 1-1.061 1.06l-2.5-2.5a.75.75 0 0 1 0-1.06l2.5-2.5a.75.75 0 0 1 1.06 0ZM4.75 7.25A.75.75 0 0 1 5.5 8v8A.75.75 0 0 1 4 16V8a.75.75 0 0 1 .75-.75Z"
									/>
								</svg>
							</div>
							Create pull request
						</sl-button>
					</Banner>
				</Match>
			</Switch>
			{/* <sl-button onClick={handlesncForking}>can i fork this thing</sl-button> */}
			<SignInDialog
				githubAppClientId={publicEnv.PUBLIC_GITHUB_APP_CLIENT_ID}
				ref={signInDialog!}
				onClickOnSignInButton={() => {
					// hide the sign in dialog to increase UX when switching back to this window
					signInDialog?.hide()
				}}
			/>
		</>
	)
}

function Banner(props: {
	variant: SemanticColorTokens[number]
	message: string
	children: JSXElement
}) {
	let alert: SlAlert | undefined
	return (
		<sl-alert
			prop:variant={props.variant === "info" ? "primary" : props.variant}
			ref={alert}
			prop:open={true}
		>
			<Icon name={props.variant} slot="icon" />
			<div class="flex space-x-4 items-center">
				<p class="grow">{props.message}</p>
				{props.children}
			</div>
		</sl-select>
	)
}
