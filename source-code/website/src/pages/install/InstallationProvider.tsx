import { type JSXElement, createEffect } from "solid-js"
import { openRepository, createNodeishMemoryFs } from "@lix-js/client"
import { publicEnv } from "@inlang/env-variables"
import {
	LocalStorageProvider,
	getLocalStorage,
	useLocalStorage,
} from "#src/services/local-storage/index.js"
import { ProjectConfig, tryCatch } from "@inlang/sdk"
import type { Step } from "./index.page.jsx"
import { marketplaceItems } from "@inlang/marketplace"
import type { RecentProjectType } from "#src/services/local-storage/src/schema.js"

export function InstallationProvider(props: {
	repo: string
	packages: string[]
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
		packages: string[]
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
	} else if (!props.packages || props.packages.length === 0 || props.packages[0] === "") {
		props.setStep({
			type: "no-packages",
			message: "No packages provided. You can find packages in the marketplace.",
			error: true,
		})
	} else if (!validatePackages(props.packages)) {
		props.setStep({
			type: "invalid-packages",
			message: "Invalid packages provided.",
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
		initializeRepo(props.repo, props.packages, user!, props.step, props.setStep)
	}
}

/**
 * This function initializes the repository by adding the packages to the project.inlang.json file and pushing the changes to the repository.
 * If there are any errors, the error will be displayed in the UI.
 */
async function initializeRepo(
	repoURL: string,
	packagesURL: string[],
	user: { username: string; email: string },
	step: () => Step,
	setStep: (step: Step) => void,
) {
	packagesURL = packagesURL.filter((pkg, index) => packagesURL.indexOf(pkg) === index)

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
		message: "Cloning Repository...",
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

	const inlangProject = parseProjectResult.data as ProjectConfig

	/* Look if the modules were already installed */
	for (const pkg of inlangProject.packages) {
		const installedPackages = packagesURL.every((packageURL) => pkg.includes(packageURL))
		if (installedPackages) {
			setStep({
				type: "already-installed",
				message: "The packages are already installed in your repository.",
				error: true,
			})
		}
	}

	/* If no modules where found in the project, create an empty array */
	if (!inlangProject.packages) inlangProject.packages = []

	const packagesToInstall = packagesURL.filter((packageURL) => {
		if (inlangProject.packages.length === 0) return true

		const installedPackages = inlangProject.packages.every((pkg) => pkg.includes(packageURL))
		return !installedPackages
	})
	inlangProject.packages.push(...packagesToInstall)

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
		message: "inlang: install package",
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
			"Successfully installed the packages: " +
			packagesURL.join(", ") +
			" in your repository: " +
			repoURL +
			".",
		error: false,
	})
}

/**
 * This function checks if the packages provided in the URL are in the marketplace registry.
 */
function validatePackages(packages: string[]) {
	let check = true
	for (const pkg of packages) {
		if (
			!marketplaceItems.some(
				(marketplaceItem) =>
					marketplaceItem.type !== "app" &&
					marketplaceItem.type !== "library" &&
					marketplaceItem.package.includes(pkg),
			)
		) {
			check = false
		} else {
			check = true
		}
	}
	return check
}
