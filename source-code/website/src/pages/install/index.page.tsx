import { createSignal, Show } from "solid-js"
import { Layout as RootLayout } from "../Layout.jsx"
import { Meta, Title } from "@solidjs/meta"
import { CommunityProjects } from "../index/CommunityProjects.jsx"
import { Button } from "../index/components/Button.jsx"
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
	type: "github-login",
	message: "",
})

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

	function validateInstallation() {
		if (!repo || !modules) return false

		return true
	}

	return (
		<>
			<Title>inlang Install</Title>
			<Meta
				name="description"
				content="Contribute to open source projects and manage translations with inlang's editor."
			/>
			<Meta name="og:image" content="/images/inlang-social-image.jpg" />
			<RootLayout>
				<div class="flex flex-col items-center justify-center h-screen gap-16 pb-64">
					<Show when={validateInstallation()}>
						<InstallationProvider repo={repo} modules={modules} step={step} setStep={setStep}>
							<Show when={step().type === "github-login"}>
								<SetupCard>
									<div>
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
								<ShowError />
							</Show>
						</InstallationProvider>
					</Show>
				</div>
			</RootLayout>
		</>
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
