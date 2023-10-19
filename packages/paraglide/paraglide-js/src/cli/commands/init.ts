import { Command } from "commander"
import fs from "node:fs/promises"
import { loadProject, type InlangProject, type ProjectSettings } from "@inlang/sdk"
import consola from "consola"

export const initCommand = new Command()
	.name("init")
	.summary("Initializes inlang Paraglide-JS.")
	.action(async () => {
		// --- LOAD THE PROJECT ---

		consola.log("Welcome to inlang Paraglide-JS 🪂")

		const userHasExistingProject = await consola.prompt("Do you have an existing inlang project?", {
			type: "confirm",
			default: false,
		})

		consola.log(userHasExistingProject)

		return

		// const project = await (userHasExistingProject ? findExistingInlangProject : createNewProject())

		// if (project.errors().length > 0) {
		// 	// log.error("The project has errors:")
		// 	for (const error of project.errors()) {
		// 		console.error(error)
		// 	}
		// 	console.info
		// 	return process.exit(1)
		// }

		// // --- ADD RECOMMENDATIONS ---

		// consola.success(
		// 	"Complete.\n\nFor questions and feedback, visit https://github.com/inlang/monorepo/discussions."
		// )
	})

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const findExistingInlangProject = async (testInput: () => any): Promise<InlangProject> => {
	let projectPath: string
	consola.start("Searching for the inlang project file...")
	// s.start("Searching for the inlang project file...")
	for (const path of [
		"./project.inlang.json",
		"../project.inlang.json",
		"../../project.inlang.json",
	]) {
		try {
			await fs.access(path)
			consola.success(`Found and using the inlang project file at "${path}".`)
			projectPath = path
			break
		} catch {
			continue
		}
	}

	consola.info("No inlang project file found.")
	projectPath =
		testInput() ??
		(await consola.prompt("Please enter the path to the inlang project file:", {
			default: "./project.inlang.json",
			type: "text",
		}))
	const project = await loadProject({
		settingsFilePath: projectPath,
		nodeishFs: fs,
	})
	return project
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const createNewProject = async (): Promise<InlangProject> => {
	const projectPath = "./project.inlang.json"
	consola.info(`Creating a new inlang project at ${projectPath}`)
	await fs.writeFile("./project.inlang.json", JSON.stringify(newProjectTemplate, undefined, 2))
	const project = await loadProject({
		settingsFilePath: projectPath,
		nodeishFs: fs,
	})
	return project
}

const newProjectTemplate: ProjectSettings = {
	$schema: "https://inlang.com/schema/project-settings",
	// defaulting to english to not overwhelm new users
	// with prompts. They can change this later.
	sourceLanguageTag: "en",
	languageTags: ["en"],
	modules: [
		// for instant gratification, we're adding the most common rules
		"https://cdn.jsdelivr.net/npm/@inlang/message-lint-rule-empty-pattern@latest/dist/index.js",
		"https://cdn.jsdelivr.net/npm/@inlang/message-lint-rule-identical-pattern@latest/dist/index.js",
		"https://cdn.jsdelivr.net/npm/@inlang/message-lint-rule-missing-translation@latest/dist/index.js",
		"https://cdn.jsdelivr.net/npm/@inlang/message-lint-rule-without-source@latest/dist/index.js",
		// default to the message format plugin because it supports all features
		"https://cdn.jsdelivr.net/npm/@inlang/plugin-message-format@latest/dist/index.js",
	],
	"plugin.inlang.messageFormat": {
		// using .paraglide-js as directory to avoid future conflicts when an official .inlang
		// directory is introduced, see https://github.com/inlang/monorepo/discussions/1418
		filePath: "./.paraglide-js/messages.json",
	},
}
