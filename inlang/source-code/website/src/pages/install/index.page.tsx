import { createSignal, For, Show } from "solid-js"
import { Meta, Title } from "@solidjs/meta"
import { useLocalStorage } from "#src/services/local-storage/index.js"
import { Button } from "../index/components/Button.jsx"
import { z } from "zod"
import { InstallationProvider } from "./InstallationProvider.jsx"
import { SetupCard } from "./components/SetupCard.jsx"
import IconGithub from "~icons/cib/github"
import { Icon } from "#src/interface/components/Icon.jsx"
import { GetHelp } from "#src/interface/components/GetHelp.jsx"
import { setSearchParams } from "./helper/setSearchParams.js"
import MarketplaceLayout from "#src/interface/marketplace/MarketplaceLayout.jsx"
import { currentPageContext } from "#src/renderer/state.js"
import { RepositoryCard } from "#src/interface/components/RepositoryCard.jsx"
import { SignInDialog } from "#src/services/auth/index.js"
import type SlDialog from "@shoelace-style/shoelace/dist/components/dialog/dialog.js"
import { browserAuth } from "@lix-js/client"

export type Step = {
	type: string
	message?: string
	error?: boolean
}

const [step, setStep] = createSignal<Step>({
	type: "initial",
})
const [optIn, setOptIn] = createSignal(false)

let optInButton: HTMLButtonElement

/**
 * Sets a title, useful for cloning of larger repos to see process in the tab
 */
const dynamicTitle = () => {
	switch (step().type) {
		case "initial":
			return "inlang Install"
		case "github-login" || "opt-in":
			return "Action required"
		case "installing":
			return "Installing modules..."
		case "success":
			return "Installation successful"
		case "already-installed":
			return "Modules already installed"
		default:
			return "inlang Install"
	}
}

export function Page() {
	const repo = currentPageContext.urlParsed.search["repo"] || ""
	const modules = currentPageContext.urlParsed.search["module"]?.split(",") || []
	let signInDialog: SlDialog | undefined

	function onSignIn() {
		signInDialog?.show()
	}

	return (
		<>
			<Title>{dynamicTitle()}</Title>
			<Meta
				name="description"
				content="Contribute to open source projects and manage translations with inlang's editor."
			/>
			<Meta name="og:image" content="/images/inlang-social-image.jpg" />
			<MarketplaceLayout>
				<div class="h-screen flex flex-col items-center justify-center pb-32">
					<InstallationProvider
						repo={repo}
						modules={modules}
						step={step}
						setStep={setStep}
						optIn={{
							optIn,
							setOptIn,
							optInButton,
						}}
					>
						<div
							class={
								"flex-grow flex justify-center items-center " +
								(step().type !== "no-repo" && "pb-16")
							}
						>
							<Show when={step().type === "github-login"}>
								<SetupCard>
									<div class="text-center">
										<h2 class="text-[24px] leading-tight md:text-2xl font-semibold mb-2">
											Please authorize to continue
										</h2>
										<p class="text-surface-500 mb-8">
											We need your authorization to install modules in your repository.
										</p>
										<sl-button
											prop:size="medium"
											onClick={() => {
												return onSignIn()
											}}
											class={"on-inverted"}
										>
											<div slot="prefix">
												<IconGithub />
											</div>
											Login
										</sl-button>
									</div>
									<SignInDialog
										ref={signInDialog!}
										onClickOnSignInButton={() => {
											// hide the sign in dialog to increase UX when switching back to this window
											browserAuth.login()
											signInDialog?.hide().then(() => {
												if (!repo || repo === "") {
													console.error("No repo provided")
													window.location.reload()
												} else {
													setStep({
														type: "opt-in",
														message:
															"We need your authorization to install modules in your repository.",
													})
												}
											})
										}}
									/>
								</SetupCard>
							</Show>

							<Show when={step().type === "opt-in"}>
								<OptIn modules={modules} />
							</Show>
							<Show when={step().type === "installing"}>
								<ShowProgress />
							</Show>
							<Show when={step().type === "success"}>
								<ShowSuccess repo={repo} />
							</Show>
							<Show when={step().error}>
								<Show when={step().type === "no-repo"} fallback={<ShowError />}>
									<ChooseRepo modules={modules} />
								</Show>
							</Show>
						</div>
					</InstallationProvider>
					<GetHelp text="Need help installing modules?" />
				</div>
			</MarketplaceLayout>
		</>
	)
}

/* This Component uses a lot of logic from the editor, it lets the user select a repository */
function ChooseRepo(props: { modules?: string[] }) {
	const [input, setInput] = createSignal("")
	const [store] = useLocalStorage()

	const isValidUrl = () =>
		z
			.string()
			.url()
			.regex(/github/)
			.safeParse(input()).success

	function generateInstallLink() {
		const url = new URL(input())
		return `/install?repo=${url.host}${url.pathname
			.split("/")
			.slice(0, 3)
			.join("/")}&module=${props.modules?.join(",")}`
	}

	return (
		<div class="w-full flex flex-col items-center">
			<div class="flex flex-col justify-center gap-4 items-center">
				<h2 class="text-[24px] leading-tight md:text-2xl font-semibold text-center">
					Insert your repository link
				</h2>
				<p class="text-surface-500 text-center">
					You can install modules into your repository <br /> by providing the repository URL below.
				</p>
			</div>
			<div class="flex flex-col p-2 md:p-10 items-center tracking-tight">
				<form
					class="relative w-full md:w-[600px] flex items-center group mt-4 mb-8"
					onSubmit={(event) => {
						event.preventDefault()
						setSearchParams(generateInstallLink())
					}}
				>
					<div class="px-2 gap-2 relative z-10 flex items-center w-full border border-surface-200 bg-background rounded-lg focus-within:border-primary transition-all ">
						<input
							class="active:outline-0 focus:outline-0 focus:ring-0 border-0 h-14 grow placeholder:text-surface-500 placeholder:font-normal placeholder:text-base"
							placeholder="https://github.com/user/example"
							onInput={(event) => {
								// @ts-ignore
								setInput(event.target.value)
							}}
							onPaste={(event) => {
								// @ts-ignore
								setInput(event.target.value)
							}}
							on:sl-change={() => {
								isValidUrl() ? setSearchParams(generateInstallLink()) : undefined
							}}
						/>
						<button
							disabled={isValidUrl() === false}
							onClick={() => {
								setSearchParams(generateInstallLink())
							}}
							class={
								(isValidUrl()
									? "bg-surface-800 text-background hover:bg-on-background"
									: "bg-background text-surface-600 border") +
								" flex justify-center items-center h-10 relative rounded-md px-4 border-surface-200 transition-all duration-100 text-sm font-medium"
							}
						>
							Install
						</button>
					</div>
				</form>
			</div>
			<div>
				<Show when={store.recentProjects.length > 0}>
					<h2 class="text-lg font-medium text-slate-900">Recent</h2>
					<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 py-4 w-full auto-rows-min pb-24">
						{/* Shows a total of max 3 repos */}
						<For each={store.recentProjects.slice(0, 3)}>
							{(recentProject) => (
								/* The surrounding div sets the searchParams */
								<div
									onClick={() =>
										setSearchParams(
											`/install?repo=github.com/${recentProject.owner}/${
												recentProject.repository
											}&module=${props.modules?.join(",")}`
										)
									}
								>
									<RepositoryCard repository={recentProject} install modules={props.modules} />
								</div>
							)}
						</For>
					</div>
				</Show>
			</div>
		</div>
	)
}

/* Lets the user opt-in before making changes to the repository */
function OptIn(props: { modules: string[] }) {
	return (
		<SetupCard>
			<div class="flex flex-col justify-center gap-4 items-center mb-2">
				<Icon name="info" class="w-20 h-20 text-primary-500 mb-2 text-primary" />
				<h2 class="text-[24px] leading-tight md:text-2xl font-semibold text-center">
					{step().message}
				</h2>
				<p class="text-surface-500 text-center">
					The config in your repository will be updated to include the module you selected:
				</p>
				<ul class="font-medium font-mono text-sm bg-success/10 p-2 rounded-md">
					<For each={props.modules}>
						{(module) => (
							<li class="truncate text-success">
								+ "{module}"
								<Show when={props.modules?.indexOf(module) !== props.modules.length - 1}>,</Show>
							</li>
						)}
					</For>
				</ul>
			</div>
			<div class="flex items-center gap-6">
				<Button
					// eslint-disable-next-line solid/reactivity
					function={() => {
						setOptIn(true)
					}}
					type="primary"
					ref={optInButton}
				>
					Install module
				</Button>
				<Button
					// eslint-disable-next-line solid/reactivity
					function={() => {
						setSearchParams(`/`)
					}}
					type="text"
				>
					Cancel
				</Button>
			</div>
		</SetupCard>
	)
}

/* This Component showcases the process lix and the InstallationProvider is doing */
function ShowProgress() {
	return (
		<SetupCard>
			{/* Big loading spinner */}
			<div class="relative h-24 w-24 animate-spin mb-4">
				<div class="h-full w-full bg-surface-50 border-primary border-4 rounded-full" />
				<div class="h-1/2 w-1/2 absolute top-0 left-0 z-5 bg-surface-50" />
			</div>
			<div class="flex flex-col justify-center gap-4 items-center">
				<h2 class="text-[24px] leading-tight md:text-2xl font-semibold text-center">
					Installing your modules…
				</h2>
				<p class="text-surface-500">{step().message}</p>
			</div>
		</SetupCard>
	)
}

/* This Component shows the success message and converts the user to the editor */
function ShowSuccess(props: { repo: string }) {
	return (
		<SetupCard success>
			<Icon name="success" class="w-20 h-20 text-success-500 mb-2 text-success" />
			<div class="flex flex-col justify-center gap-2 items-center">
				<h2 class="text-[24px] leading-tight md:text-2xl font-semibold text-center">
					Installation successful
				</h2>
				<p class="text-surface-500 text-center mb-4">{step().message}</p>
				<Button
					// eslint-disable-next-line solid/reactivity
					function={() => {
						setSearchParams(`/editor/${props.repo}`)
					}}
					type="secondary"
				>
					Check it out
				</Button>
			</div>
		</SetupCard>
	)
}

/* This Component shows errors, the more transparent errors are shown the better the UX */
function ShowError() {
	return (
		<SetupCard error>
			<Icon name="danger" class="w-20 h-20 text-error-500 mb-2 text-danger" />
			<div class="flex flex-col justify-center gap-2 items-center">
				<h2 class="text-[24px] leading-tight md:text-2xl font-semibold text-center">
					{step().type === "already-installed"
						? "Module already installed"
						: "Something went wrong"}
				</h2>
				<p class="text-surface-500 text-center mb-6">{step().message}</p>
				<Show
					when={step().type !== "no-module"}
					fallback={
						<Button
							// eslint-disable-next-line solid/reactivity
							function={() => {
								setSearchParams("/")
							}}
							type="primary"
						>
							Browse modules
						</Button>
					}
				>
					<div class="flex items-center gap-6">
						<Button
							function={() => {
								window.location.reload()
							}}
							type="primary"
						>
							Try again
						</Button>
						<Button
							function={() => {
								setSearchParams(`/`)
							}}
							type="text"
						>
							Cancel
						</Button>
					</div>
				</Show>
			</div>
		</SetupCard>
	)
}
