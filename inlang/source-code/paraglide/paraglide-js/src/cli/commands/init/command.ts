import { Command } from "commander"
import consola from "consola"
import dedent from "dedent"
import * as nodePath from "node:path"
import nodeFsPromises from "node:fs/promises"
import type { InlangProject } from "@inlang/sdk"
import { detectJsonFormatting } from "@inlang/detect-json-formatting"
import { telemetry } from "~/services/telemetry/implementation.js"
import { Logger } from "~/services/logger/index.js"
import { findRepoRoot, openRepository, type Repository } from "@lix-js/client"
import { findPackageJson } from "~/services/environment/package.js"
import { promptSelection } from "./utils.js"
import { compile } from "~/compiler/compile.js"
import { writeOutput } from "~/services/file-handling/write-output.js"
import type { CliStep } from "./cli-utils.js"
import { checkForUncommittedChanges } from "./steps/check-for-uncomitted-changes.js"
import { initializeInlangProject } from "./steps/initialize-inlang-project.js"
import { maybeAddSherlock } from "./steps/maybe-add-sherlock.js"
import { maybeChangeTsConfig } from "./steps/update-ts-config.js"
import { promptForOutdir } from "./steps/prompt-for-outdir.js"
import { updatePackageJson } from "./steps/update-package-json.js"

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

		const ctx1 = await checkForUncommittedChanges(ctx)
		const ctx2 = await enforcePackageJsonExists(ctx1)
		const ctx3 = await initializeInlangProject(ctx2)
		const ctx4 = await promptForOutdir(ctx3)
		telemetry.capture({ event: "PARAGLIDE-JS init project initialized" })
		const ctx5 = await addParaglideJsToDevDependencies(ctx4)
		telemetry.capture({ event: "PARAGLIDE-JS init added to devDependencies" })
		const ctx6 = await addCompileStepToPackageJSON(ctx5)
		telemetry.capture({ event: "PARAGLIDE-JS init added compile commands" })
		const ctx7 = await maybeChangeTsConfig(ctx6)
		const ctx8 = await maybeAddSherlock(ctx7)

		try {
			await executeCompilation(ctx8)
			ctx.logger.success("Run paraglide compiler")
		} catch (e) {
			ctx.logger.warn(
				"Failed to compile project automatically. You will need to run the compiler manually"
			)
		}

		telemetry.capture({ event: "PARAGLIDE-JS init finished" })

		const absoluteSettingsPath = nodePath.resolve(ctx8.projectPath, "settings.json")
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

export const addParaglideJsToDevDependencies: CliStep<
	{
		repo: Repository
		logger: Logger
		packageJsonPath: string
	},
	unknown
> = async (ctx) => {
	const ctx1 = await updatePackageJson({
		devDependencies: (devDeps) => ({
			...devDeps,
			"@inlang/paraglide-js": PACKAGE_VERSION,
		}),
	})(ctx)
	ctx.logger.success("Added @inlang/paraglide-js to the devDependencies in package.json.")
	return ctx1
}

export const enforcePackageJsonExists: CliStep<
	{ logger: Logger; repo: Repository },
	{ packageJsonPath: string }
> = async (ctx) => {
	const packageJsonPath = await findPackageJson(ctx.repo.nodeishFs, process.cwd())
	if (!packageJsonPath) {
		ctx.logger.warn(
			"No package.json found in the current working directory. Please change the working directory to the directory with a package.json file."
		)
		return process.exit(0)
	}
	return { ...ctx, packageJsonPath }
}

export const addCompileStepToPackageJSON: CliStep<
	{
		repo: Repository
		logger: Logger
		projectPath: string
		outdir: string
		packageJsonPath: string
	},
	unknown
> = async (ctx) => {
	const relativePathToProject = nodePath.relative(process.cwd(), ctx.projectPath)
	const projectPath = `./${relativePathToProject}`

	const file = await ctx.repo.nodeishFs.readFile(ctx.packageJsonPath, { encoding: "utf-8" })
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
