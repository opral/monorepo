import { Repository, findRepoRoot, openRepository } from "@lix-js/client"
import type { CliStep } from "../utils"
import { Command } from "commander"
import nodeFsPromises from "node:fs/promises"
import { NodeishFilesystem } from "@lix-js/fs"
import path from "node:path"
import { Logger } from "@inlang/paraglide-js/internal"
import { Steps, cli as ParaglideCli } from "@inlang/paraglide-js/internal/cli"
import consola from "consola"
import { SetUpI18nRoutingFlow } from "../flows/set-up-i18n-routing"

type NextConfigFile = {
	path: string
	type: "cjs" | "esm"
}

export const InitCommand = new Command()
	.name("init")
	.summary("Initializes Paraglide-JS in this NextJS Project")
	.action(async () => {
		const repoRoot = await findRepoRoot({ nodeishFs: nodeFsPromises, path: process.cwd() })

		// We are risking that there is no git repo. As long as we only use FS features and no Git features
		// from the SDK we should be fine.
		// Basic operations like `loadProject` should always work without a repo since it's used in CI.
		const repo = await openRepository(repoRoot ?? "file://" + process.cwd(), {
			nodeishFs: nodeFsPromises,
		})

		const logger = new Logger({ prefix: false, silent: false })

		const ctx0 = await Steps.checkForUncommittedChanges({
			repo,
			repoRoot: repoRoot?.replace("file://", "") ?? process.cwd(),
			logger,
			appId: MARKETPLACE_ID,
		})

		const ctx1 = await findAndEnforceRequiredFiles(ctx0)
		const ctx2 = await enforceAppRouter(ctx1)
		const ctx3 = { ...ctx2, outdir: path.resolve(ctx2.srcRoot, "paraglide") }
		const ctx4 = await Steps.initializeInlangProject(ctx3)
		const ctx5 = await Steps.updatePackageJson({
			dependencies: async (deps) => ({
				...deps,
				"@inlang/paraglide-next": PARAGLIDE_NEXT_VERSION,
			}),
			devDependencies: async (deps) => ({
				...deps,
				"@inlang/paraglide-js": ParaglideCli.version() as string,
			}),
		})(ctx4)
		const ctx6 = await createI18nFile(ctx5)
		const ctx7 = await createMiddlewareFile(ctx6)
		const ctx8 = await updateNextConfig(ctx7)
		const ctx9 = await addLanguageProvider(ctx8)
		const ctx10 = await maybeMigrateI18nRouting(ctx9)
		try {
			await Steps.runCompiler(ctx10)
		} catch (e) {
			//silently ignore
		}

		logger.success(`Successfully initialized Paraglide-JS in this NextJS Project.

Learn more about Paraglide and Paraglide-Next at:
https://inlang.com/m/osslbuzt/paraglide-next-i18n
`)
	})

const enforceAppRouter: CliStep<
	{ repo: Repository; logger: Logger; srcRoot: string },
	unknown
> = async (ctx) => {
	// check if the src/app folder exists
	const expectedAppFolderPath = path.join(ctx.srcRoot, "app")
	try {
		const stat = await ctx.repo.nodeishFs.stat(expectedAppFolderPath)
		if (!stat.isDirectory()) throw new Error()
	} catch {
		ctx.logger.error(
			"The paraglide-next init command can only be used in projects using the App router"
		)
		process.exit(0)
	}
	return ctx
}

const findAndEnforceRequiredFiles: CliStep<
	{
		repo: Repository
		logger: Logger
	},
	{
		/** Absolute Path to the next.config.js or next.config.mjs */
		nextConfigFile: NextConfigFile
		packageJsonPath: string
		srcRoot: string
	}
> = async (ctx) => {
	const packageJsonPath = await findPackageJson(ctx.repo.nodeishFs, process.cwd())
	if (!packageJsonPath) {
		ctx.logger.error(`Could not find package.json. Rerun this command inside a NextJS project.`)
		process.exit(1)
	}

	const nextConfigFile = await findNextConfig(ctx.repo.nodeishFs, process.cwd())
	if (!nextConfigFile) {
		ctx.logger.error(`Could not find Next Config File. Rerun this command inside a NextJS project.`)
		process.exit(1)
	}

	// if the ./src directory exists -> srcRoot = ./src
	// otherwise -> srcRoot  = .

	let srcRoot
	try {
		const stat = await ctx.repo.nodeishFs.stat(path.resolve(process.cwd(), "src"))
		if (!stat.isDirectory()) throw Error()
		srcRoot = path.resolve(process.cwd(), "src")
	} catch {
		srcRoot = process.cwd()
	}

	return { ...ctx, srcRoot, nextConfigFile: nextConfigFile, packageJsonPath }
}

/**
 * Attempts to find the next.config.js or next.config.mjs file in the current working directory.
 */
async function findNextConfig(
	fs: NodeishFilesystem,
	cwd: string
): Promise<NextConfigFile | undefined> {
	const possibleNextConfigPaths = ["./next.config.js", "./next.config.mjs"].map(
		(possibleRelativePath) => path.resolve(cwd, possibleRelativePath)
	)

	for (const possibleNextConfigPath of possibleNextConfigPaths) {
		try {
			const stat = await fs.stat(possibleNextConfigPath)
			if (!stat.isFile()) continue

			return {
				path: possibleNextConfigPath,
				type: possibleNextConfigPath.endsWith(".mjs") ? "esm" : "cjs",
			}
		} catch {
			continue
		}
	}

	return undefined
}

/**
 * Attempts to find the package.json file in the current working directory.
 */
async function findPackageJson(fs: NodeishFilesystem, cwd: string): Promise<string | undefined> {
	const potentialPackageJsonPath = path.resolve(cwd, "package.json")
	try {
		const stat = await fs.stat(potentialPackageJsonPath)
		if (!stat.isFile()) {
			return undefined
		}
		return potentialPackageJsonPath
	} catch {
		return undefined
	}
}

const createI18nFile: CliStep<{ srcRoot: string; repo: Repository }, unknown> = async (ctx) => {
	const i18nFilePath = path.join(ctx.srcRoot, "lib/i18n.ts")

	const file = `// file generated by the Paraglide-Next init command
import { createI18n } from "@inlang/paraglide-next"
import type { AvailableLanguageTag } from "@/paraglide/runtime"

export const { Link, middleware, useRouter, usePathname, redirect, permanentRedirect, localizePath, } 
	= createI18n<AvailableLanguageTag>();
`
	//create the folder if it doesn't exist
	await ctx.repo.nodeishFs.mkdir(path.dirname(i18nFilePath), { recursive: true })
	await ctx.repo.nodeishFs.writeFile(i18nFilePath, file)
	return ctx
}

const createMiddlewareFile: CliStep<
	{ srcRoot: string; repo: Repository; logger: Logger },
	unknown
> = async (ctx) => {
	const middlewareFilePath = path.join(ctx.srcRoot, "middleware.ts")

	//check if the middleware file already exists
	let alreadyExists: boolean
	try {
		await ctx.repo.nodeishFs.stat(middlewareFilePath)
		alreadyExists = true
	} catch {
		//if the middleware file doesn't exist, create it
		alreadyExists = false
	}

	if (alreadyExists) {
		ctx.logger.warn(
			"Skipping creating the `middleware.ts` file as it already exists. Please manually add the middleware exported from @/lib/i18n"
		)
		return ctx
	}

	const file = `// file generated by the Paraglide-Next init command
export { middleware } from "@/lib/i18n"

export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - api (API routes)
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 */
		"/((?!api|_next/static|_next/image|favicon.ico).*)",
	],
}
`

	//create the folder if it doesn't exist
	await ctx.repo.nodeishFs.mkdir(path.dirname(middlewareFilePath), { recursive: true })
	await ctx.repo.nodeishFs.writeFile(middlewareFilePath, file)
	return ctx
}

const updateNextConfig: CliStep<
	{
		nextConfigFile: NextConfigFile
		logger: Logger
		repo: Repository
		outdir: string
		projectPath: string
	},
	unknown
> = async (ctx) => {
	//read the next.config.js file
	let fileContent: string
	try {
		fileContent = await ctx.repo.nodeishFs.readFile(ctx.nextConfigFile.path, { encoding: "utf-8" })
	} catch (e) {
		ctx.logger.error("Failed to read next config file at " + ctx.nextConfigFile.path)
		process.exit(1)
	}

	if (fileContent.includes("paraglide")) {
		ctx.logger.warn(
			"Skipping adding the paraglide plugin to `next.config.js` as it already seems to be added"
		)
		return ctx
	}

	//Add the import
	const importStatement: string = {
		esm: 'import { paraglide } from "@inlang/paraglide-next/plugin"',
		cjs: 'const { paraglide } = require("@inlang/paraglide-next/plugin")',
	}[ctx.nextConfigFile.type]

	fileContent = importStatement + "\n" + fileContent

	const exportRegex = {
		esm: /export\s+default\s+(?<configIdentifier>[a-zA-Z0-9]+)(?=\s|;)/gm,
		cjs: /module.exports\s+=\s+(?<configIdentifier>[a-zA-Z0-9]+)(?=\s|;)/gm,
	}[ctx.nextConfigFile.type]

	const match = exportRegex.exec(fileContent)
	if (!match) {
		ctx.logger.warn(
			`Failed to find the export default statement in next.config.js
You will have to add the paraglide plugin manually

Learn how to do that in the documentation:
https://inlang.com/m/osslbuzt/paraglide-next-i18n
`
		)
	} else {
		const exportDefault = match
		const startIndex = exportDefault.index
		const endIndex = startIndex + exportDefault[0].length
		const configIdentifier = match.groups?.configIdentifier as string
		const identifierStartIndex = endIndex - configIdentifier.length

		const relativeOutdir = "./" + path.relative(process.cwd(), ctx.outdir)
		const relativeProjectPath = "./" + path.relative(process.cwd(), ctx.projectPath)

		const wrappedIdentifier = `paraglide({
	paraglide: {
		project: "${relativeProjectPath}",
		outdir: "${relativeOutdir}"
	},
	...${configIdentifier}
})`

		//replace the wrapped identifier with the actual identifier
		fileContent =
			fileContent.slice(0, Math.max(0, identifierStartIndex)) +
			wrappedIdentifier +
			fileContent.slice(Math.max(0, endIndex))

		ctx.logger.info("Added the paraglide plugin to next.config.js")
		await ctx.repo.nodeishFs.writeFile(ctx.nextConfigFile.path, fileContent)
	}

	return ctx
}

const addLanguageProvider: CliStep<
	{
		repo: Repository
		logger: Logger
		srcRoot: string
	},
	unknown
> = async (ctx) => {
	const layoutFilePath = path.join(ctx.srcRoot, "app/layout.tsx")
	let layoutFileContent: string
	try {
		layoutFileContent = await ctx.repo.nodeishFs.readFile(layoutFilePath, { encoding: "utf-8" })
	} catch (e) {
		ctx.logger.warn(
			"Failed to add the `<LanguageProvider>` to `app/layout.tsx`. You'll need to add it yourself"
		)
		return ctx
	}

	if (layoutFileContent.includes("LanguageProvider")) {
		ctx.logger.warn(
			"Skipping add ingthe `<LanguageProvider>` to `app/layout.tsx` as it already seems to be added"
		)
		return ctx
	}

	layoutFileContent = `import { LanguageProvider } from "@inlang/paraglide-next"\nimport { languageTag } from "@/paraglide/runtime.js"\n${layoutFileContent}`
	layoutFileContent = layoutFileContent.replace('lang="en"', `lang={languageTag()}`)

	//find the "<html" literal & it's indentation
	const htmlIndex = layoutFileContent.indexOf("<html")
	if (htmlIndex === -1) {
		ctx.logger.warn(
			"Failed to add the `<LanguageProvider>` to `app/layout.tsx`. You'll need to add it yourself"
		)
		return ctx
	}

	const indentationMatch = layoutFileContent.slice(0, htmlIndex).match(/\s+/)
	const htmlIndentation = indentationMatch?.[indentationMatch.length - 1] || "    "

	layoutFileContent = layoutFileContent.replace(
		"<html",
		`<LanguageProvider>\n${htmlIndentation}  <html`
	)
	layoutFileContent = layoutFileContent.replace(
		"/html>",
		`/html>\n${htmlIndentation}</LanguageProvider>`
	)

	await ctx.repo.nodeishFs.writeFile(layoutFilePath, layoutFileContent)
	return ctx
}

const maybeMigrateI18nRouting: CliStep<
	{ repo: Repository; logger: Logger; srcRoot: string },
	unknown
> = async (ctx) => {
	const response = await consola.prompt(
		"Do you want to update your <Link>s for localised routing? (recommended)\nThis will replace any imports from next/link and next/navigation with their localised counterparts",
		{
			type: "confirm",
			initial: true,
		}
	)

	if (!response) return ctx
	return await SetUpI18nRoutingFlow(ctx)
}
