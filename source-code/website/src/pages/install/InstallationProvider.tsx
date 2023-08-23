import { createSignal, Show, type JSXElement, onMount } from "solid-js"
import { open, createNodeishMemoryFs } from "@project-lisa/client"
import { publicEnv } from "@inlang/env-variables"
import { LocalStorageProvider, useLocalStorage } from "#src/services/local-storage/index.js"
import { Gitlogin } from "./components/GitLogin.jsx"
import { SetupCard } from "./components/SetupCard.jsx"
import type { InlangConfig } from "@inlang/app"
import { Icon } from "#src/components/Icon.jsx"

type Error =
	| { type: "already-installed"; message: string }
	| { type: "no-inlang-config"; message: string }
	| { type: "error"; message: string }

type ValidState = "github-login" | "select-repo" | "select-module" | "installing" | "done"

type State = ValidState | Error

type user = {
	username: string
	avatarUrl: string
	email: string
}

const [step, setStep] = createSignal<State>("github-login")

export function InstallationProvider(props: {
	repo: string
	modules: string[]
	children: JSXElement
}) {
	const [localStorage] = useLocalStorage() ?? []
	const user = localStorage?.user

	onMount(() => {
		if (!user) {
			setStep("github-login")
		} else if (!props.repo) {
			setStep("select-repo")
		} else if (!props.modules) {
			setStep("select-module")
		} else {
			setStep("installing")
			initializeRepo(props.repo, props.modules, user!)
		}
	})

	return (
		<>
			<LocalStorageProvider>
				<Show when={step() === "github-login"}>
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
				<Show when={step() === "installing"}>{props.children}</Show>
				<Show when={step() === "done"}>
					<SetupCard>
						<Icon class="text-success mx-auto text-6xl" name={"success"} />
						<div>
							<h2 class="text-[24px] leading-tight md:text-2xl font-semibold mb-2">Done</h2>
							<p class="text-surface-500">
								Your modules were successfully installed in your repository.
							</p>
						</div>
					</SetupCard>
				</Show>
				{/* // TODO: Fix types
				@ts-ignore */}
				<Show when={step().type}>
					<SetupCard error>
						<div>
							<h2 class="text-[24px] leading-tight md:text-2xl font-semibold mb-2">
								{/* @ts-ignore */}
								{step().type}
							</h2>
							{/* @ts-ignore */}
							<p>{step().message}</p>
						</div>
					</SetupCard>
				</Show>
			</LocalStorageProvider>
		</>
	)
}

async function initializeRepo(repoURL: string, modulesURL: string[], user: user) {
	// In case of a redirect error, remove double module entries
	modulesURL = modulesURL.filter((module, index) => modulesURL.indexOf(module) === index)

	// Open the repository
	const repo = open(repoURL, {
		nodeishFs: createNodeishMemoryFs(),
		corsProxy: publicEnv.PUBLIC_GIT_PROXY_PATH,
	})

	// Get the content of the inlang.config.js file
	const inlangConfigString = (await repo.nodeishFs
		.readFile("./inlang.config.js", {
			encoding: "utf-8",
		})
		.catch((e) => {
			if (e.code !== "ENOENT") throw e
			setStep({
				type: "no-inlang-config",
				message: "No inlang.config.js file found in the repository.",
			})
			return
		})) as string

	// Convert the inlang.config.js file to a JavaScript object
	let inlangConfig: InlangConfig
	try {
		inlangConfig = eval(`(${inlangConfigString.replace(/[^{]*/, "")})`)
	} catch (e) {
		setStep({
			type: "error",
			message: "Error parsing inlang.config.js: " + e,
		})
		return
	}

	inlangConfig.modules?.forEach((module: string) => {
		const installedModules = modulesURL.every((moduleURL) => module.includes(moduleURL))
		if (installedModules) {
			setStep({
				type: "already-installed",
				message: "The modules are already installed in your repository.",
			})
			return
		}
	})

	// Add the modules to the inlang.config.js file
	if (!inlangConfig.modules) inlangConfig.modules = []

	// only install modules that are not already installed
	const modulesToInstall = modulesURL.filter(
		(moduleURL) => !inlangConfig.modules?.includes(moduleURL),
	)
	inlangConfig.modules.push(...modulesToInstall)

	// Merge into the inlangConfigString to be able to write it back to the file
	const generatedInlangConfig = String(
		inlangConfigString.replace(/{[^}]*}/, writeObjectToPlainText(inlangConfig)),
	)

	// Write the new inlang.config.js back to the repository
	await repo.nodeishFs.writeFile("./inlang.config.js", generatedInlangConfig)

	console.log(step())

	if (step() !== "installing") return

	// Add the changes
	await repo.add({
		filepath: "inlang.config.js",
	})

	// Commit the changes
	await repo.commit({
		message: "inlang: install modules (test)",
		author: {
			name: user.username,
			email: user.email,
		},
	})

	// Push the changes
	await repo.push()

	// Set the step to done
	setStep("done")
}

function writeObjectToPlainText(object: Record<string, unknown>) {
	let result = "{"
	for (const key in object) {
		if (Array.isArray(object[key])) {
			result += `${key}: ${JSON.stringify(object[key])}, `
		} else {
			result += `${key}: ${JSON.stringify(object[key])}, `
		}
	}
	result += "}"

	result = result.replace(/,(?![^[]*\])/g, ",\n")
	return result
}
