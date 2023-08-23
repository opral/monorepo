import { type JSXElement, onMount } from "solid-js"
import { open, createNodeishMemoryFs } from "@project-lisa/client"
import { publicEnv } from "@inlang/env-variables"
import {
	LocalStorageProvider,
	getLocalStorage,
	useLocalStorage,
} from "#src/services/local-storage/index.js"
import type { InlangConfig, tryCatch } from "@inlang/app"
import type { Step } from "./index.page.jsx"
import { marketplaceItems } from "@inlang/marketplace"

export function InstallationProvider(props: {
	repo: string
	modules: string[]
	step: () => Step
	setStep: (step: Step) => void
	children: JSXElement
}) {
	const [localStorage] = useLocalStorage() ?? []
	const user = localStorage?.user

	onMount(() => {
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
		} else if (!props.modules || props.modules.length === 0) {
			props.setStep({
				type: "no-modules",
				message: "No modules provided.",
				error: true,
			})
		} else if (!validateModules(props.modules)) {
			props.setStep({
				type: "invalid-modules",
				message: "Invalid modules provided.",
				error: true,
			})
		} else {
			props.setStep({
				type: "installing",
				message: "Starting installation...",
				error: false,
			})

			initializeRepo(props.repo, props.modules, user!, props.step, props.setStep)
		}
	})

	return <LocalStorageProvider>{props.children}</LocalStorageProvider>
}

async function initializeRepo(
	repoURL: string,
	modulesURL: string[],
	user: { username: string; email: string },
	step: () => Step,
	setStep: (step: Step) => void,
) {
	modulesURL = modulesURL.filter((module, index) => modulesURL.indexOf(module) === index)

	const repo = open(repoURL, {
		nodeishFs: createNodeishMemoryFs(),
		corsProxy: publicEnv.PUBLIC_GIT_PROXY_PATH,
	})

	setStep({
		type: "installing",
		message: "Cloning Repository...",
	})

	// Todo: tryCatch()
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
		})) as string

	let inlangConfig: InlangConfig
	try {
		inlangConfig = eval(`(${inlangConfigString.replace(/[^{]*/, "")})`)
	} catch (e) {
		setStep({
			type: "error",
			message: "Error parsing inlang.config.js: " + e,
			error: true,
		})
		return
	}

	inlangConfig.modules?.forEach((module: string) => {
		const installedModules = modulesURL.every((moduleURL) => module.includes(moduleURL))
		if (installedModules) {
			setStep({
				type: "already-installed",
				message: "The modules are already installed in your repository.",
				error: true,
			})
		}
	})

	if (!inlangConfig.modules) inlangConfig.modules = []

	const modulesToInstall = modulesURL.filter(
		(moduleURL) => !inlangConfig.modules?.includes(moduleURL),
	)
	inlangConfig.modules.push(...modulesToInstall)

	const generatedInlangConfig = String(
		inlangConfigString.replace(/{[^}]*}/, writeObjectToPlainText(inlangConfig)),
	)

	await repo.nodeishFs.writeFile("./inlang.config.js", generatedInlangConfig)

	if (step().error) return

	setStep({
		type: "installing",
		message: "Comitting changes...",
	})

	await repo.add({
		filepath: "inlang.config.js",
	})

	await repo.commit({
		message: "inlang: install modules (test)",
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
		message: "Successfully installed the modules: " + modulesURL.join(", "),
		error: false,
	})
}

/**
 * This function writes an object to a string in plain text, otherwise it would end up in [Object object]
 */
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

function sendSuccessResponseToSource(response: string, source: Window) {
	// ToDo: send the response to the source window e.g. CLI
}

/**
 * This function checks if the modules provided in the URL are in the marketplace registry.
 */
function validateModules(modules: string[]) {
	let check = true
	modules.forEach((module) => {
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
	})
	return check
}
