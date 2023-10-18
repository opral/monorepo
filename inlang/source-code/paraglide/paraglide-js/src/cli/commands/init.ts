import { Command } from "commander"
import fs from "node:fs/promises"
import { loadProject, type InlangProject, type ProjectSettings } from "@inlang/sdk"
import consola from "consola"
import { intro, log, outro, spinner, text, confirm } from "@clack/prompts"

export const initCommand = new Command()
	.name("init")
	.summary("Initializes inlang Paraglide-JS.")
	.action(() => _runInitCommand())

// exported for testing purposes
export const _runInitCommand = async (mockUserInput?: any[]) => {
	// --- SETUP TEST INPUT CONSUMER ---
	const testInput = () => {
		if (mockUserInput === undefined) return
		const input = mockUserInput.shift()
		if (input === undefined) {
			throw new Error("End of test input")
		}
		return input
	}

	// --- LOAD THE PROJECT ---

	intro("Welcome to inlang Paraglide-JS 🪂")

	const userHasExistingProject =
		testInput() ??
		(await confirm({
			message: "Do you have an existing inlang project?",
			initialValue: false,
		}))

	consola.log(userHasExistingProject)

	const project = await (userHasExistingProject
		? findExistingInlangProject(testInput)
		: createNewProject())

	if (project.errors().length > 0) {
		log.error("The project has errors:")
		for (const error of project.errors()) {
			console.error(error)
		}
		console.info
		return process.exit(1)
	}

	// --- ADD RECOMMENDATIONS ---

	outro(
		"Complete.\n\nFor questions and feedback, visit https://github.com/inlang/monorepo/discussions."
	)
}

const findExistingInlangProject = async (testInput: () => any): Promise<InlangProject> => {
	let projectPath: string
	const s = spinner()
	s.start("Searching for the inlang project file...")
	for (const path of [
		"./project.inlang.json",
		"../project.inlang.json",
		"../../project.inlang.json",
	]) {
		try {
			await fs.access(path)
			s.stop(`Found and using the inlang project file at "${path}".`)
			projectPath = path
			break
		} catch {
			continue
		}
	}
	s.stop("No inlang project file found.")
	projectPath =
		testInput() ??
		((await text({
			message: "Please enter the path to the inlang project file:",
			placeholder: "./project.inlang.json",
		})) as string)
	const project = await loadProject({
		settingsFilePath: projectPath,
		nodeishFs: fs,
	})
	return project
}

const createNewProject = async (): Promise<InlangProject> => {
	const projectPath = "./project.inlang.json"
	log.info(`Creating a new inlang project at ${projectPath}`)
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
