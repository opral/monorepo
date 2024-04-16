import { Repository, findRepoRoot, openRepository } from "@lix-js/client"
import type { CliStep } from "../utils"
import { Command } from "commander"
import nodeFsPromises from "node:fs/promises"
import { NodeishFilesystem } from "@lix-js/fs"
import path from "node:path"
import { Logger } from "@inlang/paraglide-js/internal"

type NextConfigFile = {
	path: string
	format: "js" | "mjs"
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

		const logger = new Logger()

		const ctx1 = await findAndEnforceRequiredFiles({ repo, repoRoot, logger })
		const ctx2 = await addDependenciesToPackageJson(ctx1)

		logger.success(
			JSON.stringify(
				{ hasSrcDir: ctx1.hasSrcDir, nextConfigFile: ctx1.nextConfigFile },
				undefined,
				2
			)
		)
	})

const addDependenciesToPackageJson: CliStep<
	{
		repo: Repository
		logger: Logger
		packageJsonPath: string
	},
	unknown
> = async (ctx) => {
	return ctx
}

const findAndEnforceRequiredFiles: CliStep<
	{
		repo: Repository
		logger: Logger
	},
	{
		hasSrcDir: boolean
		/** Absolute Path to the next.config.js or next.config.mjs */
		nextConfigFile: NextConfigFile
		packageJsonPath: string
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

	return { ...ctx, hasSrcDir: false, nextConfigFile: nextConfigFile, packageJsonPath }
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

			const format = possibleNextConfigPath.endsWith(".mjs") ? "mjs" : "js"
			return { path: possibleNextConfigPath, format }
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
