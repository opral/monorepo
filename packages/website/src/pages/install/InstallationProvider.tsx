import { type JSXElement, createEffect, createSignal } from "solid-js"
import { openRepository, createNodeishMemoryFs } from "@project-lisa/client"
import { publicEnv } from "@inlang/env-variables"
import {
	LocalStorageProvider,
	getLocalStorage,
	useLocalStorage,
} from "#src/services/local-storage/index.js"
import { InlangConfig, tryCatch } from "@inlang/app"
import type { Step } from "./index.page.jsx"
import { marketplaceItems } from "@inlang/marketplace"
import type { RecentProjectType } from "#src/services/local-storage/src/schema.js"

export function InstallationProvider(props: {
	repo: string
	modules: string[]
	step: () => Step
	setStep: (step: Step) => void
	optIn: Record<string, any>
	children: JSXElement
}) {
	const [localStorage, setLocalStorage] = useLocalStorage() ?? []
	const user = localStorage?.user

	/**
	 * This function checks for common errors before repo initialization (to be more performant) and sets the step accordingly.
	 */
	createEffect(() => {
		if (!user && getLocalStorage()) {
			props.setStep({
				type: "github-login",
				error: false,
			})
		} else if (!props.repo) {
			props.setStep({
				type: "no-repo",
				message: "No repository URL provided.",
				error: true,
			})
		} else if (!props.modules || props.modules.length === 0 || props.modules[0] === "") {
			props.setStep({
				type: "no-modules",
				message: "No modules provided. You can find modules in the marketplace.",
				error: true,
			})
			// ToDo: Enable this when the marketplace is ready
			// } else if (!validateModules(props.modules)) {
			// 	props.setStep({
			// 		type: "invalid-modules",
			// 		message: "Invalid modules provided.",
			// 		error: true,
			// 	})
			// }
		} else if (!props.optIn.optIn()) {
			props.setStep({
				type: "opt-in",
				message: "Please opt-in to the installation.",
			})
		} else {
			props.setStep({
				type: "installing",
				message: "Starting installation...",
				error: false,
			})

			setRecentProject()
			initializeRepo(props.repo, props.modules, user!, props.step, props.setStep)
		}
	})

	/* Set recent project into local storage */
	function setRecentProject() {
		// eslint-disable-next-line solid/reactivity
		setLocalStorage("recentProjects", (prev) => {
			let recentProjects = prev[0] !== undefined ? prev : []

			const newProject: RecentProjectType = {
				owner: props.repo.slice(
					props.repo.indexOf("/") + 1,
					props.repo.indexOf("/", props.repo.indexOf("/") + 1),
				),
				repository: props.repo.slice(
					props.repo.indexOf("/", props.repo.indexOf("/") + 1) + 1,
					props.repo.length,
				),
				description: "",
				lastOpened: new Date().getTime(),
			}

			recentProjects = recentProjects.filter(
				(project) =>
					!(project.owner === newProject.owner && project.repository === newProject.repository),
			)

			recentProjects.push(newProject)

			return recentProjects.sort((a, b) => b.lastOpened - a.lastOpened).slice(0, 7)
		})
	}

	return <LocalStorageProvider>{props.children}</LocalStorageProvider>
}

/**
 * This function initializes the repository by adding the modules to the inlang.config.js file and pushing the changes to the repository.
 * If there are any errors, the error will be displayed in the UI.
 */
async function initializeRepo(
	repoURL: string,
	modulesURL: string[],
	user: { username: string; email: string },
	step: () => Step,
	setStep: (step: Step) => void,
) {
	modulesURL = modulesURL.filter((module, index) => modulesURL.indexOf(module) === index)

	const repo = openRepository(repoURL, {
		nodeishFs: createNodeishMemoryFs(),
		corsProxy: publicEnv.PUBLIC_GIT_PROXY_PATH,
	})

	// check if user is collaborator
	const isCollaborator = await repo.isCollaborator({
		username: user.username,
	})

	if (!isCollaborator) {
		setStep({
			type: "error",
			message: "You are not a collaborator of this repository.",
			error: true,
		})

		return
	}

	setStep({
		type: "installing",
		message: "Cloning Repository...",
	})

	const configResult = await tryCatch(async () => {
		const inlangConfigString = (await repo.nodeishFs.readFile("./inlang.config.json", {
			encoding: "utf-8",
		})) as string

		return inlangConfigString
	})

	if (configResult.error) {
		setStep({
			type: "no-inlang-config",
			message: "No inlang.config.json file found in the repository.",
			error: true,
		})

		return
	}

	const inlangConfigString = configResult.data

	const parseConfigResult = tryCatch(() => {
		return JSON.parse(inlangConfigString)
	})

	if (parseConfigResult.error) {
		setStep({
			type: "error",
			message: "Error parsing inlang.config.js: " + parseConfigResult.error,
			error: true,
		})

		return
	}

	const inlangConfig = parseConfigResult.data as InlangConfig

	for (const module of inlangConfig.modules) {
		const installedModules = modulesURL.every((moduleURL) => module.includes(moduleURL))
		if (installedModules) {
			setStep({
				type: "already-installed",
				message: "The modules are already installed in your repository.",
				error: true,
			})
		}
	}

	if (!inlangConfig.modules) inlangConfig.modules = []

	const modulesToInstall = modulesURL.filter((moduleURL) => {
		if (inlangConfig.modules.length === 0) return true

		const installedModules = inlangConfig.modules.every((module) => module.includes(moduleURL))
		return !installedModules
	})
	inlangConfig.modules.push(...modulesToInstall)

	const generatedInlangConfig = JSON.stringify(inlangConfig, undefined, 2)

	await repo.nodeishFs.writeFile("./inlang.config.json", generatedInlangConfig)

	/* If any error gets unreturned before, stop the process here */
	if (step().error) return

	setStep({
		type: "installing",
		message: "Comitting changes...",
	})

	await repo.add({
		filepath: "inlang.config.json",
	})

	await repo.commit({
		message: "inlang: install module",
		author: {
			name: user.username,
			email: user.email,
		},
	})

	setStep({
		type: "installing",
		message: "Almost done...",
	})

	await repo.push()

	setStep({
		type: "success",
		message:
			"Successfully installed the modules: " +
			modulesURL.join(", ") +
			" in your repository: " +
			repoURL +
			".",
		error: false,
	})
}

function createInlangConfig(modules: string[]) {
	// ToDo: Implement for future purposes
	const inlangConfig = {
		sourceLanguageTags: ["en"],
		languageTags: ["en"],
		modules: modules,
	}

	return inlangConfig
}

function sendSuccessResponseToSource(response: string, source: Window) {
	// ToDo: send the response to the source window e.g. CLI
}

/**
 * This function checks if the modules provided in the URL are in the marketplace registry.
 */
function validateModules(modules: string[]) {
	let check = true
	for (const module of modules) {
		if (
			!marketplaceItems.some(
				(marketplaceItem) =>
					marketplaceItem.type !== "app" && marketplaceItem.module.includes(module),
			)
		) {
			check = false
		} else {
			check = true
		}
	}
	return check
}
