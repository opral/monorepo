import { createSignal, Show, type JSXElement, onMount, createEffect } from "solid-js"
import { open, createNodeishMemoryFs } from "@project-lisa/client"
import { createInlang } from "@inlang/app"
import { publicEnv } from "@inlang/env-variables"
import type { InlangModule } from "@inlang/module"
import {
	LocalStorageProvider,
	getLocalStorage,
	useLocalStorage,
} from "#src/services/local-storage/index.js"
import { Gitlogin } from "./components/GitLogin.jsx"
import { SetupCard } from "./components/SetupCard.jsx"

type State = "github-login" | "select-repo" | "select-module" | "installing"
type user = {
	username: string
	avatarUrl: string
	email: string
}

export function InstallationProvider(props: {
	repo: string
	modules: string[]
	children: JSXElement
}) {
	const [step, setStep] = createSignal<State>("github-login")

	const [localStorage] = useLocalStorage() ?? []
	const user = localStorage?.user

	createEffect(() => {
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
			</LocalStorageProvider>
		</>
	)
}

async function initializeRepo(repoURL: string, modulesURL: string[], user: user) {
	// Open the repository
	const repo = open(repoURL, {
		nodeishFs: createNodeishMemoryFs(),
		corsProxy: publicEnv.PUBLIC_GIT_PROXY_PATH,
	})

	// Get the content of the inlang.config.js file
	const inlangConfigString = await repo.nodeishFs
		.readFile("./inlang.config.js", {
			encoding: "utf-8",
		})
		.catch((e) => {
			if (e.code !== "ENOENT") throw e
			throw new Error("No inlang.config.js file found in the repository.")
		})

	// Convert the inlang.config.js file to a JavaScript object
	let inlangConfig
	try {
		inlangConfig = eval(`(${inlangConfigString.replace(/[^{]*/, "")})`)
	} catch (e) {
		throw new Error("Error parsing inlang.config.js: " + e)
	}

	// Add the modules to the inlang.config.js file
	inlangConfig.modules.push(...modulesURL)

	// Merge into the inlangConfigString to be able to write it back to the file
	const newInlangConfigString = inlangConfigString.replace(/{[^}]*}/, JSON.stringify(inlangConfig))

	console.log("newInlangConfigString", newInlangConfigString)
}
