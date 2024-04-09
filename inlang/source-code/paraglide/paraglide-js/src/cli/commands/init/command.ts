import { Command } from "commander"
import consola from "consola"
import dedent from "dedent"
import * as nodePath from "node:path"
import JSON5 from "json5"
import nodeFsPromises from "node:fs/promises"
import { loadProject, listProjects, type InlangProject } from "@inlang/sdk"
import * as Sherlock from "@inlang/cross-sell-sherlock"
import { isValidLanguageTag, LanguageTag } from "@inlang/language-tag"
import { detectJsonFormatting } from "@inlang/detect-json-formatting"
import { telemetry } from "~/services/telemetry/implementation.js"
import { Logger } from "~/services/logger/index.js"
import { findRepoRoot, openRepository, type Repository } from "@lix-js/client"
import { pathExists } from "~/services/file-handling/exists.js"
import { findPackageJson } from "~/services/environment/package.js"
import { execAsync, getCommonPrefix } from "./utils.js"
import { getNewProjectTemplate, DEFAULT_PROJECT_PATH, DEFAULT_OUTDIR } from "./defaults.js"
import { compile } from "~/compiler/compile.js"
import { writeOutput } from "~/services/file-handling/write-output.js"
import type { CliStep } from "./cli-utils.js"

const ADAPTER_LINKS = {
	sveltekit: "https://inlang.com/m/dxnzrydw/paraglide-sveltekit-i18n",
	nextjs: "https://inlang.com/m/osslbuzt/paraglide-next-i18n",
	astro: "https://inlang.com/m/iljlwzfs/paraglide-astro-i18n",
	solidstart: "https://inlang.com/m/n860p17j/paraglide-solidstart-i18n",
	vite: "https://github.com/opral/monorepo/tree/main/inlang/source-code/paraglide/paraglide-js-adapter-vite",
} as const

export const initCommand = new Command()
	.name("init")
	.summary("Initializes inlang Paraglide-JS.")
	.action(async () => {
		const repoRoot = await findRepoRoot({
			nodeishFs: nodeFsPromises,
			path: process.cwd(),
		})

		// We are risking that there is no git repo. As long as we only use FS features and no Git features
		// from the SDK we should be fine.
		// Basic operations like `loadProject` should always work without a repo since it's used in CI.
		const repo = await openRepository(repoRoot ?? "file://" + process.cwd(), {
			nodeishFs: nodeFsPromises,
		})

		const logger = new Logger({ silent: false, prefix: false })

		logger.box("Welcome to inlang Paraglide-JS 🪂")
		telemetry.capture({ event: "PARAGLIDE-JS init started" })

		const ctx = {
			logger,
			repo,
			repoRoot: repoRoot?.replace("file://", "") ?? process.cwd(),
		} as const

		const ctx1 = await checkIfUncommittedChanges(ctx)
		const ctx2 = await checkIfPackageJsonExists(ctx1)
		const ctx3 = await initializeInlangProject(ctx2)
		const ctx4 = await determineOutdir(ctx3)
		telemetry.capture({ event: "PARAGLIDE-JS init project initialized" })
		const ctx5 = await addParaglideJsToDevDependencies(ctx4)
		telemetry.capture({ event: "PARAGLIDE-JS init added to devDependencies" })
		const ctx6 = await addCompileStepToPackageJSON(ctx5)
		telemetry.capture({ event: "PARAGLIDE-JS init added compile commands" })
		const ctx7 = await maybeChangeTsConfigModuleResolution(ctx6)
		const ctx8 = await maybeChangeTsConfigAllowJs(ctx7)
		const ctx9 = await maybeAddVsCodeExtension(ctx8)

		try {
			await executeCompilation(ctx9)
			ctx.logger.success("Run paraglide compiler")
		} catch (e) {
			ctx.logger.warn(
				"Failed to compile project automatically. You will need to run the compiler manually"
			)
		}

		telemetry.capture({ event: "PARAGLIDE-JS init finished" })

		const absoluteSettingsPath = nodePath.resolve(ctx9.projectPath, "settings.json")
		const relativeSettingsFilePath = absoluteSettingsPath.replace(process.cwd(), ".")

		let successMessage = dedent`inlang Paraglide-JS has been set up sucessfully.
			
			1. Run your install command (npm i, yarn install, etc)
			2. Register all your languages in ${relativeSettingsFilePath}
			3. Run the build script (npm run build, or similar.)
			4. Done :) Happy paragliding 🪂
			
			`

		const stackChoice = await promtStack()

		if (Object.keys(ADAPTER_LINKS).includes(stackChoice)) {
			successMessage += "\n\n"
			successMessage += dedent`
				HINT:
				If you are using ${stackChoice} with paraglide, you will likely also want to use 

				\`@inlang/paraglide-js-adapter-${stackChoice}\`

				Read the documentation at:
				${ADAPTER_LINKS[stackChoice as keyof typeof ADAPTER_LINKS]}
			`
		}

		successMessage += "\n\n"
		successMessage += dedent`
			For questions and feedback, visit 
			https://github.com/opral/monorepo/discussions.
		`

		ctx.logger.box(successMessage)
	})

export const initializeInlangProject: CliStep<
	{ repo: Repository; logger: Logger; repoRoot: string },
	{
		project: InlangProject
		/** Relative path to the project */
		projectPath: string
	}
> = async (ctx) => {
	const existingProjectPaths = await (
		await listProjects(ctx.repo.nodeishFs, ctx.repoRoot)
	).map((v) => v.projectPath)

	if (existingProjectPaths.length > 0) {
		const { project, projectPath } = await existingProjectFlow({
			existingProjectPaths,
			repo: ctx.repo,
			logger: ctx.logger,
		})

		return {
			...ctx,
			project,
			projectPath,
		}
	} else {
		const { project, projectPath } = await createNewProjectFlow(ctx)
		return {
			...ctx,
			project,
			projectPath,
		}
	}
}

export const maybeAddVsCodeExtension: CliStep<
	{
		repo: Repository
		logger: Logger
		project: InlangProject
	},
	unknown
> = async (ctx) => {
	const isCertainlyVsCode = process?.env?.TERM_PROGRAM === "vscode"

	let response = isCertainlyVsCode
	if (!isCertainlyVsCode) {
		response = await prompt(`Are you using Visual Studio Code?`, {
			type: "confirm",
			initial: true,
		})
	}
	if (response === false) return ctx

	const settings = ctx.project.settings()

	// m function matcher is not installed
	if (settings.modules.some((m) => m.includes("plugin-m-function-matcher")) === false) {
		// add the m function matcher plugin
		settings.modules.push(
			"https://cdn.jsdelivr.net/npm/@inlang/plugin-m-function-matcher@latest/dist/index.js"
		)
		ctx.project.setSettings(settings)
	}

	try {
		if (!(await Sherlock.isAdopted({ fs: ctx.repo.nodeishFs }))) {
			await Sherlock.add({ fs: ctx.repo.nodeishFs })

			ctx.logger.success(
				"Added the inlang Visual Studio Code extension (Sherlock) to the workspace recommendations."
			)
		}
	} catch (error) {
		ctx.logger.error(
			"Failed to add the inlang Visual Studio Code extension (Sherlock). Please open an issue"
		)
	}

	return ctx
}

export const addParaglideJsToDevDependencies: CliStep<
	{
		repo: Repository
		logger: Logger
	},
	unknown
> = async (ctx) => {
	const file = await ctx.repo.nodeishFs.readFile("./package.json", { encoding: "utf-8" })
	const stringify = detectJsonFormatting(file)
	let pkg: any = {}
	try {
		pkg = JSON.parse(file)
	} catch {
		ctx.logger.error(
			`Your ./package.json does not contain valid JSON. Please fix it and try again.`
		)
		process.exit(1)
	}
	if (pkg.devDependencies === undefined) {
		pkg.devDependencies = {}
	}
	pkg.devDependencies["@inlang/paraglide-js"] = PACKAGE_VERSION
	await ctx.repo.nodeishFs.writeFile("./package.json", stringify(pkg))
	ctx.logger.success("Added @inlang/paraglide-js to the devDependencies in package.json.")
	return ctx
}

export const determineOutdir: CliStep<
	{
		logger: Logger
	},
	{
		/** Relative path to the output directory */
		outdir: string
	}
> = async (ctx) => {
	const response = await prompt("Where should the compiled files be placed?", {
		type: "text",
		initial: DEFAULT_OUTDIR,
		default: DEFAULT_OUTDIR,
		placeholder: "Relative path from the package root to the desired compiler output directory",
	})

	if (!response.startsWith("./")) {
		ctx.logger.warn("You must enter a valid relative path starting from the package root.")
		return await determineOutdir(ctx)
	}

	return {
		...ctx,
		outdir: response,
	}
}

export const existingProjectFlow = async (ctx: {
	/** An array of absolute paths to existing projects. */
	existingProjectPaths: string[]
	repo: Repository
	logger: Logger
}): Promise<{ project: InlangProject; projectPath: string }> => {
	const NEW_PROJECT_VALUE = "newProject"

	const commonPrefix = getCommonPrefix(ctx.existingProjectPaths)

	const selection = (await prompt(
		`Do you want to use an existing Inlang Project or create a new one?`,
		{
			type: "select",
			options: [
				{ label: "Create a new project", value: NEW_PROJECT_VALUE },
				...ctx.existingProjectPaths.map((path) => {
					return {
						label: "Use '" + path.replace(commonPrefix, "") + "'",
						value: path,
					}
				}),
			],
		}
	)) as unknown as string // the prompt type is incorrect

	//if the user wants to create a new project - create one & use it
	if (selection === NEW_PROJECT_VALUE) return createNewProjectFlow(ctx)

	const projectPath = selection
	const project = await loadProject({
		projectPath,
		repo: ctx.repo,
	})

	if (project.errors().length > 0) {
		ctx.logger.error("The selected project contains errors - Aborting paraglde initialization.")
		for (const error of project.errors()) {
			ctx.logger.error(error)
		}
		process.exit(1)
	}

	return { project, projectPath }
}

function parseLanguageTagInput(input: string): {
	validLanguageTags: LanguageTag[]
	invalidLanguageTags: string[]
} {
	const languageTags = input
		.replaceAll(/[,:\s]/g, " ") //replace common separators with spaces
		.split(" ")
		.filter(Boolean) //remove empty segments
		.map((tag) => tag.toLowerCase())

	const validLanguageTags: LanguageTag[] = []
	const invalidLanguageTags: string[] = []

	for (const tag of languageTags) {
		if (isValidLanguageTag(tag)) {
			validLanguageTags.push(tag)
		} else {
			invalidLanguageTags.push(tag)
		}
	}

	return {
		validLanguageTags,
		invalidLanguageTags,
	}
}

async function promptForLanguageTags(
	initialLanguageTags: LanguageTag[] = []
): Promise<LanguageTag[]> {
	const languageTagsInput =
		(await prompt("Which languages do you want to support?", {
			type: "text",
			placeholder: "en, de-ch, ar",
			initial: initialLanguageTags.length ? initialLanguageTags.join(", ") : undefined,
		})) ?? ""

	const { invalidLanguageTags, validLanguageTags } = parseLanguageTagInput(languageTagsInput)

	if (validLanguageTags.length === 0) {
		consola.warn("You must specify at least one language tag")
		return await promptForLanguageTags()
	}

	if (invalidLanguageTags.length > 0) {
		const message =
			invalidLanguageTags.length === 1
				? invalidLanguageTags[0] +
				  " isn't a valid language tag. Please stick to IEEE BCP-47 Language Tags"
				: invalidLanguageTags.map((tag) => `"${tag}"`).join(", ") +
				  " aren't valid language tags. Please stick to IEEE BCP-47 Language Tags"

		consola.warn(message)
		return await promptForLanguageTags(validLanguageTags)
	}

	return validLanguageTags
}
export const createNewProjectFlow = async (ctx: {
	repo: Repository
	logger: Logger
}): Promise<{
	project: InlangProject
	/** An absolute path to the created project */
	projectPath: string
}> => {
	const languageTags = await promptForLanguageTags()
	const settings = getNewProjectTemplate()

	//Should always be defined. This is to shut TS up
	const sourceLanguageTag = languageTags.at(0)
	if (!sourceLanguageTag) throw new Error("sourceLanguageTag is not defined")

	settings.languageTags = languageTags
	settings.sourceLanguageTag = sourceLanguageTag

	const messagePath = settings["plugin.inlang.messageFormat"].pathPattern

	//create the messages dir if it doesn't exist
	const messageDir = nodePath.dirname(nodePath.resolve(process.cwd(), messagePath))
	ctx.repo.nodeishFs.mkdir(messageDir, { recursive: true })

	for (const languageTag of languageTags) {
		const languageFile = nodePath.resolve(messageDir, languageTag + ".json")
		//create the language file if it doesn't exist
		ctx.repo.nodeishFs.writeFile(
			languageFile,
			dedent`
			{
				"$schema": "https://inlang.com/schema/inlang-message-format"
			}`
		)
	}

	ctx.logger.info(`Creating a new inlang project in the current working directory.`)
	await ctx.repo.nodeishFs.mkdir(DEFAULT_PROJECT_PATH, { recursive: true })
	await ctx.repo.nodeishFs.writeFile(
		DEFAULT_PROJECT_PATH + "/settings.json",
		JSON.stringify(settings, undefined, 2)
	)

	const projectPath = nodePath.resolve(process.cwd(), DEFAULT_PROJECT_PATH)
	const project = await loadProject({
		projectPath,
		repo: ctx.repo,
	})

	if (project.errors().length > 0) {
		ctx.logger.warn(
			"Failed to create a new inlang project.\n\nThis is likely an internal bug. Please file an issue at https://github.com/opral/monorepo."
		)
		for (const error of project.errors()) {
			ctx.logger.error(error)
		}
		return process.exit(1)
	} else {
		ctx.logger.success("Successfully created a new inlang project.")
	}
	return { project, projectPath }
}

export const checkIfPackageJsonExists: CliStep<
	{ logger: Logger; repo: Repository },
	unknown
> = async (ctx) => {
	const packageJsonPath = await findPackageJson(ctx.repo.nodeishFs, process.cwd())
	if (!packageJsonPath) {
		ctx.logger.warn(
			"No package.json found in the current working directory. Please change the working directory to the directory with a package.json file."
		)
		return process.exit(0)
	}
	return ctx
}

export const checkIfUncommittedChanges: CliStep<{ logger: Logger }, unknown> = async (ctx) => {
	try {
		if ((await execAsync("git status --porcelain")).toString().length === 0) {
			return ctx
		}

		ctx.logger.info(
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
			return ctx
		} else {
			process.exit(0)
		}
	} catch (e) {
		// git cli is not installed
		return ctx
	}
}

export const addCompileStepToPackageJSON: CliStep<
	{ repo: Repository; logger: Logger; projectPath: string; outdir: string },
	unknown
> = async (ctx) => {
	const relativePathToProject = nodePath.relative(process.cwd(), ctx.projectPath)
	const projectPath = `./${relativePathToProject}`

	const file = await ctx.repo.nodeishFs.readFile("./package.json", { encoding: "utf-8" })
	const stringify = detectJsonFormatting(file)
	const pkg = JSON.parse(file)

	if (pkg.scripts === undefined) {
		pkg.scripts = {}
	}

	// add the compile command to the postinstall script
	// this isn't super important, so we won't interrupt the user if it fails
	if (!pkg.scripts.postinstall) {
		pkg.scripts.postinstall = `paraglide-js compile --project ${projectPath} --outdir ${ctx.outdir}`
	} else if (pkg.scripts.postinstall.includes("paraglide-js compile") === false) {
		pkg.scripts.postinstall = `paraglide-js compile --project ${projectPath} --outdir ${ctx.outdir} && ${pkg.scripts.postinstall}`
	}

	//Add the compile command to the build script
	if (pkg?.scripts?.build === undefined) {
		pkg.scripts.build = `paraglide-js compile --project ${projectPath} --outdir ${ctx.outdir}`
	} else if (pkg?.scripts?.build.includes("paraglide-js compile") === false) {
		pkg.scripts.build = `paraglide-js compile --project ${projectPath} --outdir ${ctx.outdir} && ${pkg.scripts.build}`
	} else {
		ctx.logger
			.warn(`The "build" script in the \`package.json\` already contains a "paraglide-js compile" command.

Please add the following command to your build script manually:

\`paraglide-js compile --project ${ctx.projectPath}`)
		const response = await consola.prompt(
			"Have you added the compile command to your build script?",
			{
				type: "confirm",
				initial: false,
			}
		)
		if (response === false) {
			ctx.logger.log("Please add the paraglide-js compile to your build script and try again.")
			return process.exit(0)
		} else {
			return ctx
		}
	}
	await ctx.repo.nodeishFs.writeFile("./package.json", stringify(pkg))
	ctx.logger.success("Successfully added the compile command to the build step in package.json.")

	return ctx
}

/**
 * Ensures that the moduleResolution compiler option is set to "bundler" or similar in the tsconfig.json.
 *
 * Otherwise, types defined in `package.exports` are not resolved by TypeScript. Leading to type
 * errors with Paraglide-JS.
 */
export const maybeChangeTsConfigModuleResolution: CliStep<
	{ repo: Repository; logger: Logger },
	unknown
> = async (ctx) => {
	if ((await pathExists("./tsconfig.json", ctx.repo.nodeishFs)) === false) {
		return ctx
	}
	const file = await ctx.repo.nodeishFs.readFile("./tsconfig.json", { encoding: "utf-8" })
	// tsconfig allows comments ... FML
	const tsconfig = JSON5.parse(file)

	let parentTsConfig: any | undefined

	if (tsconfig.extends) {
		try {
			const parentTsConfigPath = nodePath.resolve(process.cwd(), tsconfig.extends)
			const parentTsConfigFile = await ctx.repo.nodeishFs.readFile(parentTsConfigPath, {
				encoding: "utf-8",
			})
			parentTsConfig = JSON5.parse(parentTsConfigFile)
		} catch {
			ctx.logger.warn(
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
		return ctx
	}

	ctx.logger.info(
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
			ctx.logger.warn(
				"Continuing without adjusting the tsconfig.json. This may lead to type errors."
			)
			return ctx
		}
		const file = await ctx.repo.nodeishFs.readFile("./tsconfig.json", { encoding: "utf-8" })
		const tsconfig = JSON5.parse(file)
		if (
			tsconfig?.compilerOptions?.moduleResolution &&
			tsconfig.compilerOptions.moduleResolution.toLowerCase() === "bundler"
		) {
			isValid = true
			return ctx
		} else {
			ctx.logger.error(
				"The compiler options have not been adjusted. Please set the `compilerOptions.moduleResolution` to `Bundler`."
			)
		}
	}

	return ctx
}

/**
 * Paraligde JS compiles to JS with JSDoc comments. TypeScript doesn't allow JS files by default.
 */
export const maybeChangeTsConfigAllowJs: CliStep<
	{ repo: Repository; logger: Logger },
	unknown
> = async (ctx) => {
	if ((await pathExists("./tsconfig.json", ctx.repo.nodeishFs)) === false) {
		return ctx
	}
	const file = await ctx.repo.nodeishFs.readFile("./tsconfig.json", { encoding: "utf-8" })
	// tsconfig allows comments ... FML
	const tsconfig = JSON5.parse(file)

	if (tsconfig.compilerOptions?.allowJs === true) {
		// all clear, allowJs is already set to true
		return ctx
	}

	ctx.logger.info(
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
			ctx.logger.warn(
				"Continuing without adjusting the tsconfig.json. This may lead to type errors."
			)
			return ctx
		}
		const file = await ctx.repo.nodeishFs.readFile("./tsconfig.json", { encoding: "utf-8" })
		const tsconfig = JSON5.parse(file)
		if (tsconfig?.compilerOptions?.allowJs === true) {
			isValid = true
			return ctx
		} else {
			ctx.logger.error(
				"The compiler options have not been adjusted. Please set the `compilerOptions.allowJs` to `true`."
			)
		}
	}
	return ctx
}

const executeCompilation: CliStep<
	{
		project: InlangProject
		/** The absolute path to the output directory */
		outdir: string
		repo: Repository
	},
	unknown
> = async (ctx) => {
	const absoluteOutdir = nodePath.resolve(process.cwd(), ctx.outdir)

	const output = await compile({
		messages: ctx.project.query.messages.getAll(),
		settings: ctx.project.settings(),
		projectId: ctx.project.id,
	})

	await writeOutput(absoluteOutdir, output, ctx.repo.nodeishFs)
	return ctx
}

/**
 * Prompts the user to select the stack they are using & links to relevant documentation.
 */
async function promtStack() {
	return await promptSelection("Which tech stack are you using?", {
		options: [
			{ label: "Other", value: "other" },
			{ label: "Vanilla", value: "vanilla" },
			{ label: "NextJS", value: "nextjs" },
			{ label: "SvelteKit", value: "sveltekit" },
			{ label: "Astro", value: "astro" },
			{ label: "SolidStart", value: "solidstart" },
			{ label: "Vite", value: "vite" },
		],
		initial: "other",
	})
}

const promptSelection = async <T extends string>(
	message: string,
	options: { initial?: T; options: { label: string; value: T }[] } = { options: [] }
): Promise<T> => {
	return prompt(message, { type: "select", ...options }) as unknown as Promise<T>
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
