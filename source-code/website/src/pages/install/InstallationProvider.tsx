import { type JSXElement, onMount } from "solid-js"
import { open, createNodeishMemoryFs } from "@project-lisa/client"
import { publicEnv } from "@inlang/env-variables"
import {
	LocalStorageProvider,
	getLocalStorage,
	useLocalStorage,
} from "#src/services/local-storage/index.js"
import type { InlangConfig } from "@inlang/app"
import type { Step } from "./index.page.jsx"
import { marketplaceItems as modules } from "@inlang/marketplace"

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

	return (
		<>
			<LocalStorageProvider>{props.children}</LocalStorageProvider>
		</>
	)
}

async function initializeRepo(
	repoURL: string,
	modulesURL: string[],
	user: user,
	step: () => Step,
	setStep: (step: Step) => void,
) {
	// In case of a redirect error, remove double module entries
	modulesURL = modulesURL.filter((module, index) => modulesURL.indexOf(module) === index)

	// Open the repository
	const repo = open(repoURL, {
		nodeishFs: createNodeishMemoryFs(),
		corsProxy: publicEnv.PUBLIC_GIT_PROXY_PATH,
	})

	setStep({
		type: "installing",
		message: "Cloning Repository...",
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
		})) as string

	// Convert the inlang.config.js file to a JavaScript object
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

	if (step().error) return

	setStep({
		type: "installing",
		message: "Comitting changes...",
	})

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

	setStep({
		type: "installing",
		message: "Almost done...",
	})

	// Push the changes
	await repo.push()

	// Set the step to done
	setStep({
		type: "success",
		message: "Successfully installed the modules: " + modulesURL.join(", "),
		error: false,
	})
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

function sendSuccessResponseToSource(response: string, source: Window) {
	// ToDo: send the response to the source window
}

function validateModules(modules: string[]) {
	const validModules = modules.filter((module) => modules.includes(module))
	if (validModules.length === 0) {
		return false
	}
	return true
}
