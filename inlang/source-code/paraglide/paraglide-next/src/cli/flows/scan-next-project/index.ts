import { Logger } from "@inlang/paraglide-js/internal"
import { Repository } from "@lix-js/client"
import { CliStep, folderExists } from "../../utils"
import { NodeishFilesystem } from "@lix-js/fs"
import path from "node:path"
import consola from "consola"

type NextConfigFile = {
	path: string
	type: "cjs" | "esm"
}

export type NextJSProject = {
	configFile: NextConfigFile
	/** The absolute path to the src folder (if present), otherwise the current working directory  */
	srcRoot: string
	/** If the project uses TypeScript */
	typescript: boolean
	/** Which router the Next App uses */
	router: "app" | "pages"
}

export const scanNextJSProject: CliStep<
	{
		repo: Repository
		logger: Logger
	},
	{
		nextProject: NextJSProject
		/** The absolute path to the package.json file  */
		packageJsonPath: string
	}
> = async (ctx) => {
	const packageJsonPath = await findPackageJson(ctx.repo.nodeishFs, process.cwd())
	if (!packageJsonPath) {
		ctx.logger.error(`Could not find package.json. Rerun this command inside a NextJS project.`)
		process.exit(1)
	}

	const configFile = await findNextConfig(ctx.repo.nodeishFs, process.cwd())
	if (!configFile) {
		ctx.logger.error(`Could not find Next Config File. Rerun this command inside a NextJS project.`)
		process.exit(1)
	}

	// try to read tsconfig or JSConfig
	const tsConfigPath = path.join(process.cwd(), "tsconfig.json")
	const jsConfigPath = path.join(process.cwd(), "jsconfig.json")

	let typescript = false
	try {
		const stat = await ctx.repo.nodeishFs.stat(tsConfigPath)
		if (stat.isFile()) {
			typescript = true
		}
	} catch {
		//silently ignore
	}

	try {
		const stat = await ctx.repo.nodeishFs.stat(jsConfigPath)
		if (stat.isFile()) {
			typescript = false
		}
	} catch {
		//silently ignore
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

	let router: "app" | "pages" | undefined = undefined

	const [appFolderExists, pagesFolderExists] = await Promise.all([
		folderExists(ctx.repo.nodeishFs, path.join(srcRoot, "app")),
		folderExists(ctx.repo.nodeishFs, path.join(srcRoot, "pages")),
	])

	if (appFolderExists && !pagesFolderExists) {
		// clearly app router
		router = "app"
	} else if (!appFolderExists && pagesFolderExists) {
		// clearly pages router
		router = "pages"
	} else {
		//neither or both -> ask
		const selection = await promptSelection("Which Router are you using?", {
			initial: "app",
			options: [
				{
					label: "App Router",
					value: "app",
				},
				{
					label: "Pages Router",
					value: "pages",
				},
			],
		})

		if (!selection) {
			ctx.logger.error("Failed to determine the router being used")
			process.exit(1)
		}

		router = selection
	}

	if (!router) {
		ctx.logger.error(
			"Failed to determine the NextJS router. Please make sure either the app or pages folders exists in your project"
		)
		process.exit(1)
	}

	return {
		...ctx,
		packageJsonPath,
		nextProject: {
			srcRoot,
			configFile,

			typescript,
			router,
		},
	}
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

export const promptSelection = async <T extends string>(
	message: string,
	options: { initial?: T; options: { label: string; value: T }[] } = { options: [] }
): Promise<T> => {
	return prompt(message, { type: "select", ...options }) as unknown as Promise<T>
}

/**
 * Wrapper to exit the process if the user presses CTRL+C.
 */
export const prompt: typeof consola.prompt = async (message, options) => {
	const response = await consola.prompt(message, options)
	if (response?.toString() === "Symbol(clack:cancel)") {
		process.exit(0)
	}
	return response
}
