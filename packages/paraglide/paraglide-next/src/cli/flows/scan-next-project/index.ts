import { Logger } from "@inlang/paraglide-js/internal"
import { Repository } from "@lix-js/client"
import { CliStep } from "../../utils"
import { NodeishFilesystem } from "@lix-js/fs"
import path from "node:path"

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
	const expectedAppFolderPath = path.join(srcRoot, "app")
	const expectedPagesFolderPath = path.join(srcRoot, "pages")

	try {
		const stat = await ctx.repo.nodeishFs.stat(expectedPagesFolderPath)
		if (!stat.isDirectory()) throw new Error()
		router = "pages"
	} catch {
		//silently ignore
	}

	try {
		const stat = await ctx.repo.nodeishFs.stat(expectedAppFolderPath)
		if (!stat.isDirectory()) throw new Error()
		router = "app"
	} catch {
		//silently ignore
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
