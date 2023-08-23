import { createSignal, Show } from "solid-js"
import { Layout as RootLayout } from "../Layout.jsx"
import { Meta, Title } from "@solidjs/meta"
import { navigate } from "vite-plugin-ssr/client/router"
import { CommunityProjects } from "../index/CommunityProjects.jsx"
import { Button } from "../index/components/Button.jsx"
import { z } from "zod"
import { useI18n } from "@solid-primitives/i18n"
import { defaultLanguage } from "#src/renderer/_default.page.route.js"
import { InstallationProvider } from "./InstallationProvider.jsx"
import { SetupCard } from "./components/SetupCard.jsx"
import { Gitlogin } from "./components/GitLogin.jsx"
import { Icon } from "#src/components/Icon.jsx"

//! TEST LINK: http://localhost:3000/install?repo=github.com/floriandwt/inlang-ide-next-demo&module=https://cdn.jsdelivr.net/npm/@inlang/plugin-json@3/dist/index.js

export type Step = {
	type: string
	message?: string
	error?: boolean
}

const [step, setStep] = createSignal<Step>({
	type: "initial",
})

const dynamicTitle = () => {
	switch (step().type) {
		case "initial":
			return "inlang Install"
		case "github-login":
			return "Action required"
		case "installing":
			return "Installing modules..."
		case "success":
			return "Installation successful"
		case "already-installed":
			return "Modules already installed"
		default:
			return "Something went wrong"
	}
}

export function Page() {
	/** is not reactive because window is not reactive */
	const [, { locale }] = useI18n()

	const url = new URLSearchParams(window.location.search)
	const repo = url.get("repo") || ""
	const modules = url.get("module")?.split(",") || []

	const getLocale = () => {
		const language = locale() || defaultLanguage
		return language !== defaultLanguage ? "/" + language : ""
	}

	return (
		<>
			<Title>{dynamicTitle()}</Title>
			<Meta
				name="description"
				content="Contribute to open source projects and manage translations with inlang's editor."
			/>
			<Meta name="og:image" content="/images/inlang-social-image.jpg" />
			<RootLayout>
				<div class="flex flex-col items-center justify-center h-screen gap-16 pb-64">
					<InstallationProvider repo={repo} modules={modules} step={step} setStep={setStep}>
						<Show when={step().type === "github-login"}>
							<SetupCard>
								<div class="text-center">
									<h2 class="text-[24px] leading-tight md:text-2xl font-semibold mb-2">
										Please authorize to continue
									</h2>
									<p class="text-surface-500">
										We need your authorization to install modules in your repository.
									</p>
								</div>
								<Gitlogin />
							</SetupCard>
						</Show>

						<Show when={step().type === "installing"}>
							<ShowProgress />
						</Show>
						<Show when={step().type === "success"}>
							<ShowSuccess />
						</Show>
						<Show when={step().error}>
							<Show when={step().type === "no-repo"} fallback={<ShowError />}>
								<ChooseRepo />
							</Show>
						</Show>
					</InstallationProvider>
				</div>
			</RootLayout>
		</>
	)
}

function ChooseRepo() {
	const [input, setInput] = createSignal("")

	const isValidUrl = () =>
		z
			.string()
			.url()
			.regex(/github/)
			.safeParse(input()).success

	return (
		<div class="w-full flex flex-col items-center">
			<div class="flex flex-col p-2 md:p-10 items-center tracking-tight">
				<h2 class="text-[40px] leading-tight md:text-6xl font-bold pb-6 md:pb-8 text-center">
					Repository not found
				</h2>
				<p class="text-xl text-surface-600 w-full md:w-[600px] text-center leading-relaxed">
					To install something, you must have the{" "}
					<span class="text-base font-mono py-[5px] px-2 bg-surface-100 rounded-lg text-surface-600">
						inlang.config.js
					</span>{" "}
					file in your repository. Use the{" "}
					<span
						class="text-hover-primary hover:opacity-70 cursor-pointer"
						onClick={() => navigate("/documentation/quick-start")}
					>
						inlang CLI
					</span>{" "}
					to create this file.
				</p>
			</div>
			<form
				class="relative w-full md:w-[600px] flex items-center group mt-4 mb-24"
				onSubmit={(event) => {
					event.preventDefault()
					// add repo to url as query repo=github.com/owner/repo but replace protocol so its in this format: github.com/owner/repo
					navigate(`/install?repo=${input().replace(/(^\w+:|^)\/\//, "")}`)
					setStep({
						type: "installing",
					})
				}}
			>
				<div class="pl-5 pr-2 gap-2 relative z-10 flex items-center w-full border border-surface-200 bg-background rounded-lg focus-within:border-primary transition-all ">
					<input
						class="active:outline-0 focus:outline-0 border-0 h-14 grow placeholder:text-surface-500 placeholder:font-normal placeholder:text-base"
						placeholder="Enter repository url ..."
						onInput={(event) => {
							// @ts-ignore
							setInput(event.target.value)
						}}
						onPaste={(event) => {
							// @ts-ignore
							setInput(event.target.value)
						}}
						on:sl-change={() =>
							isValidUrl()
								? navigate(`/install?repo=${input().replace(/(^\w+:|^)\/\//, "")}`)
								: undefined
						}
					/>
					<button
						disabled={isValidUrl() === false}
						onClick={() => {
							navigate(`/install?repo=${input().replace(/(^\w+:|^)\/\//, "")}`)
						}}
						class={
							(isValidUrl()
								? "bg-surface-800 text-background hover:bg-on-background"
								: "bg-background text-surface-600 border") +
							" flex justify-center items-center h-10 relative rounded-md px-4 border-surface-200 transition-all duration-100 text-sm font-medium"
						}
					>
						Install modules
					</button>
				</div>
			</form>
			{/* <CommunityProjects justShowRecent /> */}
		</div>
	)
}

function ShowProgress() {
	return (
		<SetupCard>
			{/* Big loading spinner */}
			<div class="relative h-24 w-24 animate-spin mb-4">
				<div class="h-full w-full bg-background border-primary border-4 rounded-full" />
				<div class="h-1/2 w-1/2 absolute top-0 left-0 z-5 bg-background" />
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

function ShowSuccess() {
	return (
		<SetupCard success>
			<Icon name="success" class="w-24 h-24 text-success-500 mb-2 text-success" />
			<div class="flex flex-col justify-center gap-4 items-center">
				<h2 class="text-[24px] leading-tight md:text-2xl font-semibold text-center">
					Installing your modules…
				</h2>
				<p class="text-surface-500 text-center mb-2">{step().message}</p>
				<Button
					function={() => {
						window.close()
					}}
					type="secondary"
				>
					Close Window
				</Button>
			</div>
		</SetupCard>
	)
}

function ShowError() {
	return (
		<SetupCard error>
			<Icon name="danger" class="w-24 h-24 text-error-500 mb-2 text-danger" />
			<div class="flex flex-col justify-center gap-4 items-center">
				<h2 class="text-[24px] leading-tight md:text-2xl font-semibold text-center">
					{step().type === "already-installed"
						? "Modules already installed"
						: "Something went wrong"}
				</h2>
				<p class="text-surface-500 text-center mb-2">
					{step().message} You can close this window now.
				</p>
				<Button
					function={() => {
						step().type === "no-modules" // redirect to /marketplace
							? (window.location.href = "/marketplace") // close window
							: window.close()
					}}
					type="secondary"
				>
					{step().type === "no-modules" ? "Search on marketplace" : "Close Window"}
				</Button>
			</div>
		</SetupCard>
	)
}
