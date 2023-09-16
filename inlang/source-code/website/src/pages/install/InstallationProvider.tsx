import { type JSXElement, createEffect } from "solid-js"
import { openRepository, createNodeishMemoryFs } from "@lix-js/client"
import { publicEnv } from "@inlang/env-variables"
import {
	LocalStorageProvider,
	getLocalStorage,
	useLocalStorage,
} from "#src/services/local-storage/index.js"
import { ProjectSettings } from "@inlang/sdk"
import { tryCatch } from "@inlang/result"
import type { Step } from "./index.page.jsx"
import { registry } from "@inlang/marketplace-registry"
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

	createEffect(() => {
		validateRepo(user, setRecentProject, props)
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
 * This function checks for common errors before repo initialization (to be more performant) and sets the step accordingly.
 */
function validateRepo(
	user: { username: string; email: string } | undefined,
	setRecentProject: () => void,
	props: {
		repo: string
		modules: string[]
		step: () => Step
		setStep: (step: Step) => void
		optIn: Record<string, any>
	},
) {
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
			type: "no-module",
			message: "No module provided. You can find modules in the marketplace.",
			error: true,
		})
	} else if (!props.optIn.optIn()) {
		props.setStep({
			type: "opt-in",
			message: "We will update the project file in your repository.",
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
}

/**
 * This function initializes the repository by adding the modules to the project.inlang.json file and pushing the changes to the repository.
 * If there are any errors, the error will be displayed in the UI.
 */
async function initializeRepo(
	repoURL: string,
	modulesID: string[],
	user: { username: string; email: string },
	step: () => Step,
	setStep: (step: Step) => void,
) {
	const modulesURL = modulesID.map((url) => {
		const module = registry.find((module) => module.id.toLowerCase() === url.toLowerCase())
		//@ts-ignore
		if (module?.module.includes("@latest")) return module?.module
		//@ts-ignore
		return getLatestVersion(module?.module)
	})

	if (modulesURL.includes(undefined)) {
		setStep({
			type: "error",
			message: "The id of the module is not valid.",
			error: true,
		})

		return
	}

	/* Opens the repository with lix */
	const repo = await openRepository(repoURL, {
		nodeishFs: createNodeishMemoryFs(),
		corsProxy: publicEnv.PUBLIC_GIT_PROXY_PATH,
	})

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
		message: "Opening Repository...",
	})

	const projectResult = await tryCatch(async () => {
		const inlangProjectString = (await repo.nodeishFs.readFile("./project.inlang.json", {
			encoding: "utf-8",
		})) as string

		return inlangProjectString
	})

	if (projectResult.error) {
		setStep({
			type: "no-inlang-project",
			message: "No project.inlang.json file found in the repository.",
			error: true,
		})

		return
	}

	const inlangProjectString = projectResult.data

	const parseProjectResult = tryCatch(() => {
		return JSON.parse(inlangProjectString)
	})

	if (parseProjectResult.error) {
		setStep({
			type: "error",
			message: "Error parsing project.inlang.json: " + parseProjectResult.error,
			error: true,
		})

		return
	}

	const inlangProject = parseProjectResult.data as ProjectSettings

	/* Look if the modules were already installed */
	for (const pkg of inlangProject.modules) {
		const installedModules = modulesURL.every((moduleURL) => pkg.includes(moduleURL))
		if (installedModules) {
			setStep({
				type: "already-installed",
				message: "The module is already installed in your repository.",
				error: true,
			})
		}
	}

	/* If no modules where found in the project, create an empty array */
	if (!inlangProject.modules) inlangProject.modules = []

	const modulesToInstall = modulesURL.filter((moduleURL) => {
		if (inlangProject.modules.length === 0) return true

		const installedModules = inlangProject.modules.every((module: string) =>
			module.includes(moduleURL),
		)
		return !installedModules
	})
	inlangProject.modules.push(...modulesToInstall)

	const generatedInlangProject = JSON.stringify(inlangProject, undefined, 2)

	await repo.nodeishFs.writeFile("./project.inlang.json", generatedInlangProject)

	/* If any error has gone through, stop the installation here */
	if (step().error) return

	/* Otherwise, change the repo and finishd the process */
	setStep({
		type: "installing",
		message: "Comitting changes...",
	})

	await repo.add({
		filepath: "project.inlang.json",
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

function getLatestVersion(moduleURL: string) {
	return (
		moduleURL.slice(0, moduleURL.lastIndexOf("@")) +
		"@latest" +
		moduleURL.slice(moduleURL.indexOf("/", moduleURL.lastIndexOf("@")))
	)
}
