import { Command } from "commander"
import fs from "node:fs/promises"
import { existsSync } from "node:fs"
import { loadProject, type ProjectSettings } from "@inlang/sdk"
import consola from "consola"
import { resolve } from "node:path"
import { detectJsonFormatting } from "@inlang/detect-json-formatting"
import JSON5 from "json5"
import { execSync } from "node:child_process"

const DEFAULT_PROJECT_PATH = "./project.inlang.json"

export const initCommand = new Command()
	.name("init")
	.summary("Initializes inlang Paraglide-JS.")
	.action(async () => {
		consola.box("Welcome to inlang Paraglide-JS 🪂")

		await checkIfUncommittedChanges()
		await checkIfPackageJsonExists()
		const projectPath = await initializeInlangProject()
		const namespace = await promptForNamespace()
		await addCompileStepToPackageJSON({ projectPath, namespace })
		await adjustTsConfigIfNecessary()

		consola.box(
			"✅ inlang Paraglide-JS has been set up sucessfully. Happy paragliding 🪂\n\nFor questions and feedback, visit https://github.com/inlang/monorepo/discussions."
		)
	})

const initializeInlangProject = async () => {
	const existingProjectPath = await findExistingInlangProjectPath()

	if (existingProjectPath) {
		await existingProjectFlow({ existingProjectPath })
		return existingProjectPath
	} else {
		await createNewProjectFlow()
		return DEFAULT_PROJECT_PATH
	}
}

const promptForNamespace = async (): Promise<string> => {
	const directoryName = process.cwd().split("/").pop()

	const namespace = await prompt(
		`What should be the name of the project?

The name is used to create an importable 'namespace' to distinguish between multiple projects in the same repository. For example, the name 'frontend' will create the following import statement:

\`import * as m from "@inlang/paraglide-js/frontend/messages"\`
`,
		{
			type: "text",
			initial: directoryName,
		}
	)
	return namespace.slice(namespace.indexOf(">>")).trim()
}

const findExistingInlangProjectPath = async (): Promise<string | undefined> => {
	for (const path of [
		"./project.inlang.json",
		"../project.inlang.json",
		"../../project.inlang.json",
	]) {
		try {
			await fs.access(path)
			return path
		} catch {
			continue
		}
	}
	return undefined
}

const existingProjectFlow = async (args: { existingProjectPath: string }) => {
	const selection = await prompt(
		`Do you want to use the inlang project at "${args.existingProjectPath}" or create a new project?`,
		{
			type: "select",
			options: [
				{ label: "Use this project", value: "useExistingProject" },
				{ label: "Create a new project", value: "newProject" },
			],
		}
	)

	if (selection.value === "newProject") {
		return createNewProjectFlow()
	}
	const project = await loadProject({
		settingsFilePath: resolve(process.cwd(), args.existingProjectPath),
		nodeishFs: fs,
	})
	if (project.errors().length > 0) {
		consola.error("The project contains errors: ")
		for (const error of project.errors()) {
			consola.error(error)
		}
		process.exit(1)
	}
}

const createNewProjectFlow = async () => {
	consola.info(`Creating a new inlang project in the current working directory.`)
	await fs.writeFile(DEFAULT_PROJECT_PATH, JSON.stringify(newProjectTemplate, undefined, 2))
	const project = await loadProject({
		settingsFilePath: resolve(process.cwd(), DEFAULT_PROJECT_PATH),
		nodeishFs: fs,
	})
	if (project.errors().length > 0) {
		consola.error("Failed to create a new inlang project.")
		consola.log(
			"This is likely an internal bug. Please file an issue at https://github.com/inlang/monorepo."
		)
		for (const error of project.errors()) {
			consola.error(error)
		}
		return process.exit(1)
	} else {
		consola.success("Successfully created a new inlang project.")
	}
}

const newProjectTemplate: ProjectSettings = {
	$schema: "https://inlang.com/schema/project-settings",
	// defaulting to english to not overwhelm new users
	// with prompts. The user can change this later.
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
		// using .inlang/paraglide-js as directory to avoid future conflicts when an official .inlang
		// directory is introduced, see https://github.com/inlang/monorepo/discussions/1418
		filePath: "./.inlang/paraglide-js/messages.json",
	},
}

const checkIfPackageJsonExists = async () => {
	if (existsSync("./package.json") === false) {
		consola.warn(
			"No package.json found in the current working directory. Please run 'npm init' first."
		)
		process.exit(0)
	}
}

const checkIfUncommittedChanges = async () => {
	if (execSync("git status --porcelain").toString().length === 0) {
		return
	}

	consola.warn(
		`You have uncommitted changes.\n\nPlease commit your changes before initializing inlang Paraglide-JS. Committing outstanding changes ensures that you don't lose any work, and see the changes the paraglide-js init command introduces.`
	)
	const response = await prompt(
		"Do you want to continue without committing your current changes?",
		{
			type: "confirm",
			initial: false,
		}
	)
	if (response === true) {
		return
	} else {
		process.exit(0)
	}
}

const addCompileStepToPackageJSON = async (args: { projectPath: string; namespace: string }) => {
	consola.start("Adding the compile command to the build step in package.json.")
	const file = await fs.readFile("./package.json", { encoding: "utf-8" })
	const stringify = detectJsonFormatting(file)
	const pkg = JSON.parse(file)
	if (pkg?.scripts?.build === undefined) {
		if (pkg.scripts === undefined) {
			pkg.scripts = {}
		}
		if (args.projectPath !== DEFAULT_PROJECT_PATH) {
			pkg.scripts.build = `paraglide-js compile --project ${args.projectPath} --namespace ${args.namespace}`
		}
	} else if (
		pkg?.scripts?.build.includes("paraglide-js compile") === false &&
		args.projectPath !== DEFAULT_PROJECT_PATH
	) {
		pkg.scripts.build = `paraglide-js compile --project ${args.projectPath} --namespace ${args.namespace} && ${pkg.scripts.build}`
	} else if (
		pkg.scripts.build.includes("paraglide-js compile") === false &&
		args.projectPath === DEFAULT_PROJECT_PATH
	) {
		pkg.scripts.build = `paraglide-js compile --namespace ${args.namespace} && ${pkg.scripts.build}`
	} else {
		consola.success("The compile command already exists build step in package.json.")
		return
	}
	await fs.writeFile("./package.json", stringify(pkg))
	consola.success("Successfully added the compile command to the build step in package.json.")
}

/**
 * Ensures that the moduleResolution compiler option is set to "bundler" or similar in the tsconfig.json.
 *
 * Otherwise, types defined in `package.exports` are not resolved by TypeScript. Leading to type
 * errors with Paraglide-JS.
 */
const adjustTsConfigIfNecessary = async () => {
	if (existsSync("./tsconfig.json") === false) {
		return
	}
	consola.info(
		"Found a tsconfig.json file. The `compilerOptions` must be set to node16, bundler, or higher to resolve package.exports."
	)
	consola.start("Checking if the tsconfig.json needs to be adjusted.")
	const file = await fs.readFile("./tsconfig.json", { encoding: "utf-8" })
	// tsconfig allows comments ... FML
	const tsconfig = JSON5.parse(file)

	let parentTsConfig: any | undefined

	if (tsconfig.extends) {
		try {
			const parentTsConfigPath = resolve(process.cwd(), tsconfig.extends)
			const parentTsConfigFile = await fs.readFile(parentTsConfigPath, { encoding: "utf-8" })
			parentTsConfig = JSON5.parse(parentTsConfigFile)
		} catch {
			consola.warn(
				`The tsconfig.json is extended from a tsconfig that couldn't be read. Maybe the file doesn't exist yet or is a NPM package. Continuing without taking the extended from tsconfig into consideration.`
			)
		}
	}

	// options that don't support package.exports
	const invalidOptions = ["classic", "node", "node10"]
	const moduleResolution =
		tsconfig.compilerOptions?.moduleResolution ?? parentTsConfig?.compilerOptions?.moduleResolution

	if (moduleResolution && invalidOptions.includes(moduleResolution.toLowerCase())) {
		consola.info(
			`You need to set the \`compilerOptions.moduleResolution\` to "Bundler" in the tsconfig.json file. Please do so now.`
		)
		let isValid = false
		while (isValid === false) {
			const response = await prompt(
				`Did you set the \`compilerOptions.moduleResolution\` to "Bundler"?`,
				{
					type: "confirm",
				}
			)
			if (response === false) {
				return consola.warn(
					"Continuing without adjusting the tsconfig.json. This may lead to type errors."
				)
			}
			const file = await fs.readFile("./tsconfig.json", { encoding: "utf-8" })
			const tsconfig = JSON5.parse(file)
			if (
				tsconfig?.compilerOptions?.moduleResolution &&
				tsconfig.compilerOptions.moduleResolution.toLowerCase() === "bundler"
			) {
				isValid = true
				consola.success("Successfully adjusted the tsconfig.json.")
			} else {
				consola.error(
					"The compiler options have not been adjusted. Please set the `compilerOptions.moduleResolution` to `Bundler`."
				)
			}
		}
	}
}

/**
 * Wrapper to exit the process if the user presses CTRL+C.
 */
const prompt: typeof consola.prompt = async (message, options) => {
	const response = await consola.prompt(message, options)
	if (response.toString() === "Symbol(clack:cancel)") {
		process.exit(0)
	}
	return response
}