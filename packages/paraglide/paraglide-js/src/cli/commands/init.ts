import { Command } from "commander"
import fs from "node:fs/promises"
import fsSync from "node:fs"
import { loadProject, type ProjectSettings } from "@inlang/sdk"
import consola from "consola"
import { resolve } from "node:path"
import { detectJsonFormatting } from "@inlang/detect-json-formatting"
import JSON5 from "json5"
import childProcess from "node:child_process"
import { version } from "../state.js"
import { telemetry } from "../../services/telemetry/implementation.js"
import { Logger } from "../../services/logger/index.js"

const DEFAULT_PROJECT_PATH = "./project.inlang"

export const initCommand = new Command()
	.name("init")
	.summary("Initializes inlang Paraglide-JS.")
	.action(async () => {
		const logger = new Logger({ silent: false, prefix: false })

		logger.box("Welcome to inlang Paraglide-JS 🪂")

		telemetry.capture({ event: "PARAGLIDE-JS init started" })

		await checkIfUncommittedChanges(logger)
		await checkIfPackageJsonExists(logger)
		const projectPath = await initializeInlangProject(logger)
		telemetry.capture({ event: "PARAGLIDE-JS init project initialized" })
		await addParaglideJsToDevDependencies(logger)
		telemetry.capture({ event: "PARAGLIDE-JS init added to devDependencies" })
		await addCompileStepToPackageJSON({ projectPath }, logger)
		telemetry.capture({ event: "PARAGLIDE-JS init added compile commands" })
		await maybeChangeTsConfigModuleResolution(logger)
		await maybeChangeTsConfigAllowJs(logger)
		await maybeAddVsCodeExtension({ projectPath }, logger)

		telemetry.capture({ event: "PARAGLIDE-JS init finished" })
		logger.box(
			"inlang Paraglide-JS has been set up sucessfully.\n\n1. Run your install command (npm i, yarn install, etc)\n2. Run the build script (npm run build, or similar.)\n3. Done :) Happy paragliding 🪂\n\n For questions and feedback, visit https://github.com/inlang/monorepo/discussions.\n"
		)
	})

export const initializeInlangProject = async (logger: Logger) => {
	const existingProjectPath = await findExistingInlangProjectPath()

	if (existingProjectPath) {
		await existingProjectFlow({ existingProjectPath }, logger)
		return existingProjectPath
	} else {
		await createNewProjectFlow(logger)
		return DEFAULT_PROJECT_PATH
	}
}

export const maybeAddVsCodeExtension = async (args: { projectPath: string }, logger: Logger) => {
	const response = await prompt(`Are you using VSCode?`, {
		type: "confirm",
		initial: true,
	})
	if (response === false) {
		return
	}

	const file = await fs.readFile(args.projectPath, { encoding: "utf-8" })
	const stringify = detectJsonFormatting(file)
	const settings = JSON.parse(file) as ProjectSettings

	// m function matcher is not installed
	if (settings.modules.some((m) => m.includes("plugin-m-function-matcher")) === false) {
		// add the m function matcher plugin
		settings.modules.push(
			"https://cdn.jsdelivr.net/npm/@inlang/plugin-m-function-matcher@latest/dist/index.js"
		)
		await fs.writeFile(args.projectPath, stringify(settings))
	}
	let extensions: any = {}
	try {
		extensions = JSON5.parse(await fs.readFile("./.vscode/extensions.json", { encoding: "utf-8" }))
	} catch {
		// continue
	}
	if (extensions.recommendations === undefined) {
		extensions.recommendations = []
	}
	if (extensions.recommendations.includes("inlang.vs-code-extension") === false) {
		extensions.recommendations.push("inlang.vs-code-extension")
		if (fsSync.existsSync("./.vscode") === false) {
			await fs.mkdir("./.vscode")
		}
		await fs.writeFile("./.vscode/extensions.json", JSON.stringify(extensions, undefined, 2))
		logger.success("Added the inlang vs code extension to the workspace recommendations.")
	}
}

export const addParaglideJsToDevDependencies = async (logger: Logger) => {
	const file = await fs.readFile("./package.json", { encoding: "utf-8" })
	const stringify = detectJsonFormatting(file)
	const pkg = JSON.parse(file)
	if (pkg.devDependencies === undefined) {
		pkg.devDependencies = {}
	}
	pkg.devDependencies["@inlang/paraglide-js"] = version
	await fs.writeFile("./package.json", stringify(pkg))
	logger.success("Added @inlang/paraglide-js to the devDependencies in package.json.")
}

export const findExistingInlangProjectPath = async (): Promise<string | undefined> => {
	for (const path of ["./project.inlang", "../project.inlang", "../../project.inlang"]) {
		if (fsSync.existsSync(path)) {
			return path
		}
		continue
	}
	return undefined
}

export const existingProjectFlow = async (
	args: { existingProjectPath: string },
	logger: Logger
) => {
	const selection = (await prompt(
		`Do you want to use the inlang project at "${args.existingProjectPath}" or create a new project?`,
		{
			type: "select",
			options: [
				{ label: "Use this project", value: "useExistingProject" },
				{ label: "Create a new project", value: "newProject" },
			],
		}
	)) as unknown as string // the prompt type is incorrect

	if (selection === "newProject") {
		return createNewProjectFlow(logger)
	}
	const project = await loadProject({
		projectPath: resolve(process.cwd(), args.existingProjectPath),
		//@ts-ignore
		nodeishFs: fs,
	})
	if (project.errors().length > 0) {
		logger.error("The project contains errors: ")
		for (const error of project.errors()) {
			logger.error(error)
		}
		process.exit(1)
	}
}

export const createNewProjectFlow = async (logger: Logger) => {
	logger.info(`Creating a new inlang project in the current working directory.`)
	await fs.mkdir(DEFAULT_PROJECT_PATH, { recursive: true })
	await fs.writeFile(
		DEFAULT_PROJECT_PATH + "/settings.json",
		JSON.stringify(newProjectTemplate, undefined, 2)
	)
	const project = await loadProject({
		projectPath: resolve(process.cwd(), DEFAULT_PROJECT_PATH),
		//@ts-ignore
		nodeishFs: fs,
	})
	if (project.errors().length > 0) {
		logger.warn(
			"Failed to create a new inlang project.\n\nThis is likely an internal bug. Please file an issue at https://github.com/inlang/monorepo."
		)
		for (const error of project.errors()) {
			logger.error(error)
		}
		return process.exit(1)
	} else {
		logger.success("Successfully created a new inlang project.")
	}
}

export const newProjectTemplate: ProjectSettings = {
	$schema: "https://inlang.com/schema/project-settings",
	// defaulting to english to not overwhelm new users
	// with prompts. The user can change this later.
	sourceLanguageTag: "en",
	languageTags: ["en"],
	modules: [
		// for instant gratification, we're adding common rules
		"https://cdn.jsdelivr.net/npm/@inlang/message-lint-rule-empty-pattern@latest/dist/index.js",
		"https://cdn.jsdelivr.net/npm/@inlang/message-lint-rule-identical-pattern@latest/dist/index.js",
		"https://cdn.jsdelivr.net/npm/@inlang/message-lint-rule-missing-translation@latest/dist/index.js",
		"https://cdn.jsdelivr.net/npm/@inlang/message-lint-rule-without-source@latest/dist/index.js",
		// default to the message format plugin because it supports all features
		"https://cdn.jsdelivr.net/npm/@inlang/plugin-message-format@latest/dist/index.js",
		// the m function matcher should be installed by default in case the ide extension is adopted
		"https://cdn.jsdelivr.net/npm/@inlang/plugin-m-function-matcher@latest/dist/index.js",
	],
	"plugin.inlang.messageFormat": {
		// using .inlang/paraglide-js as directory to avoid future conflicts when an official .inlang
		// directory is introduced, see https://github.com/inlang/monorepo/discussions/1418
		pathPattern: "./messages/{languageTag}.json",
	},
}

export const checkIfPackageJsonExists = async (logger: Logger) => {
	if (fsSync.existsSync("./package.json") === false) {
		logger.warn(
			"No package.json found in the current working directory. Please change the working directory to the directory with a package.json file."
		)
		return process.exit(0)
	}
}

export const checkIfUncommittedChanges = async (logger: Logger) => {
	try {
		if (childProcess.execSync("git status --porcelain").toString().length === 0) {
			return
		}

		logger.info(
			`You have uncommitted changes.\n\nPlease commit your changes before initializing inlang Paraglide-JS. Committing outstanding changes ensures that you don't lose any work, and see the changes the paraglide-js init command introduces.`
		)
		const response = await prompt(
			"Do you want to initialize inlang Paraglide-JS without committing your current changes?",
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
	} catch (e) {
		// git cli is not installed
		return
	}
}

export const addCompileStepToPackageJSON = async (
	args: { projectPath: string },
	logger: Logger
) => {
	const file = await fs.readFile("./package.json", { encoding: "utf-8" })
	const stringify = detectJsonFormatting(file)
	const pkg = JSON.parse(file)
	if (pkg?.scripts?.build === undefined) {
		if (pkg.scripts === undefined) {
			pkg.scripts = {}
		}
		pkg.scripts.build = `paraglide-js compile --project ${args.projectPath}`
	} else if (pkg?.scripts?.build.includes("paraglide-js compile") === false) {
		pkg.scripts.build = `paraglide-js compile --project ${args.projectPath} && ${pkg.scripts.build}`
	} else {
		logger.warn(`The "build" script in the \`package.json\` already contains a "paraglide-js compile" command.

Please add the following command to your build script manually:

\`paraglide-js compile --project ${args.projectPath}`)
		const response = await consola.prompt(
			"Have you added the compile command to your build script?",
			{
				type: "confirm",
				initial: false,
			}
		)
		if (response === false) {
			logger.log("Please add the paraglide-js compile to your build script and try again.")
			return process.exit(0)
		} else {
			return
		}
	}
	await fs.writeFile("./package.json", stringify(pkg))
	logger.success("Successfully added the compile command to the build step in package.json.")
}

/**
 * Ensures that the moduleResolution compiler option is set to "bundler" or similar in the tsconfig.json.
 *
 * Otherwise, types defined in `package.exports` are not resolved by TypeScript. Leading to type
 * errors with Paraglide-JS.
 */
export const maybeChangeTsConfigModuleResolution = async (logger: Logger): Promise<void> => {
	if (fsSync.existsSync("./tsconfig.json") === false) {
		return
	}
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
			logger.warn(
				`The tsconfig.json is extended from a tsconfig that couldn't be read. Maybe the file doesn't exist yet or is a NPM package. Continuing without taking the extended from tsconfig into consideration.`
			)
		}
	}

	// options that don't support package.exports
	const invalidOptions = ["classic", "node", "node10"]
	const moduleResolution =
		tsconfig.compilerOptions?.moduleResolution ?? parentTsConfig?.compilerOptions?.moduleResolution

	if (moduleResolution && invalidOptions.includes(moduleResolution.toLowerCase()) === false) {
		// the moduleResolution is already set to bundler or similar
		return
	}

	logger.info(
		`You need to set the \`compilerOptions.moduleResolution\` to "Bundler" in the \`tsconfig.json\` file:

\`{
  "compilerOptions": {
    "moduleResolution": "Bundler"
  }
}\``
	)
	let isValid = false
	while (isValid === false) {
		const response = await prompt(
			`Did you set the \`compilerOptions.moduleResolution\` to "Bundler"?`,
			{
				type: "confirm",
				initial: true,
			}
		)
		if (response === false) {
			logger.warn("Continuing without adjusting the tsconfig.json. This may lead to type errors.")
			return
		}
		const file = await fs.readFile("./tsconfig.json", { encoding: "utf-8" })
		const tsconfig = JSON5.parse(file)
		if (
			tsconfig?.compilerOptions?.moduleResolution &&
			tsconfig.compilerOptions.moduleResolution.toLowerCase() === "bundler"
		) {
			isValid = true
			return
		} else {
			logger.error(
				"The compiler options have not been adjusted. Please set the `compilerOptions.moduleResolution` to `Bundler`."
			)
		}
	}
}

/**
 * Paraligde JS compiles to JS with JSDoc comments. TypeScript doesn't allow JS files by default.
 */
export const maybeChangeTsConfigAllowJs = async (logger: Logger): Promise<void> => {
	if (fsSync.existsSync("./tsconfig.json") === false) {
		return
	}
	const file = await fs.readFile("./tsconfig.json", { encoding: "utf-8" })
	// tsconfig allows comments ... FML
	const tsconfig = JSON5.parse(file)

	if (tsconfig.compilerOptions?.allowJs === true) {
		// all clear, allowJs is already set to true
		return
	}

	logger.info(
		`You need to set the \`compilerOptions.allowJs\` to \`true\` in the \`tsconfig.json\` file:

\`{
  "compilerOptions": {
    "allowJs": true
  }
}\``
	)
	let isValid = false
	while (isValid === false) {
		const response = await prompt(`Did you set the \`compilerOptions.allowJs\` to \`true\`?`, {
			type: "confirm",
			initial: true,
		})
		if (response === false) {
			logger.warn("Continuing without adjusting the tsconfig.json. This may lead to type errors.")
			return
		}
		const file = await fs.readFile("./tsconfig.json", { encoding: "utf-8" })
		const tsconfig = JSON5.parse(file)
		if (tsconfig?.compilerOptions?.allowJs === true) {
			isValid = true
			return
		} else {
			logger.error(
				"The compiler options have not been adjusted. Please set the `compilerOptions.allowJs` to `true`."
			)
		}
	}
}

/**
 * Wrapper to exit the process if the user presses CTRL+C.
 */
const prompt: typeof consola.prompt = async (message, options) => {
	const response = await consola.prompt(message, options)
	if (response?.toString() === "Symbol(clack:cancel)") {
		process.exit(0)
	}
	return response
}
