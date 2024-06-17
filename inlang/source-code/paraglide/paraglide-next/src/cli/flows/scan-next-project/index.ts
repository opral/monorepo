import { Logger } from "@inlang/paraglide-js/internal"
import { Repository } from "@lix-js/client"
import { CliStep, folderExists, fileExists, promptSelection } from "../../utils"
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

	const [tsConfigExists, jsConfigExists] = await Promise.all([
		fileExists(ctx.repo.nodeishFs, path.join(process.cwd(), "tsconfig.json")),
		fileExists(ctx.repo.nodeishFs, path.join(process.cwd(), "jsconfig.json")),
	])

	const typescript = tsConfigExists && !jsConfigExists

	// if the ./src directory exists -> srcRoot = ./src
	const srcRoot = (await folderExists(ctx.repo.nodeishFs, path.resolve(process.cwd(), "src")))
		? path.resolve(process.cwd(), "src")
		: process.cwd()

	const [appFolderExists, pagesFolderExists] = await Promise.all([
		folderExists(ctx.repo.nodeishFs, path.join(srcRoot, "app")),
		folderExists(ctx.repo.nodeishFs, path.join(srcRoot, "pages")),
	])

	const router =
		appFolderExists && !pagesFolderExists
			? "app"
			: !appFolderExists && pagesFolderExists
			? "pages"
			: await promptSelection("Which Router are you using?", {
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
		if (await fileExists(fs, possibleNextConfigPath)) {
			return {
				path: possibleNextConfigPath,
				type: possibleNextConfigPath.endsWith(".mjs") ? "esm" : "cjs",
			}
		}
	}

	return undefined
}

/**
 * Attempts to find the package.json file in the current working directory.
 */
async function findPackageJson(fs: NodeishFilesystem, cwd: string): Promise<string | undefined> {
	const potentialPackageJsonPath = path.resolve(cwd, "package.json")
	const packageJsonExists = await fileExists(fs, potentialPackageJsonPath)

	return packageJsonExists ? potentialPackageJsonPath : undefined
}
