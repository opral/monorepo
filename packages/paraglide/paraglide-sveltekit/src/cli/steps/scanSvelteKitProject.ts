import type { Repository } from "@lix-js/client"
import type { CliStep } from "../utils.js"
import path from "node:path"
import type { Logger } from "@inlang/paraglide-js/internal"

export const scanSvelteKitProject: CliStep<
	{ repo: Repository; logger: Logger },
	{
		packageJsonPath: string
		viteConfigPath: string
		svelteConfigPath: string
		typescript: boolean
	}
> = async (ctx) => {
	const packageJsonPath = await findFile({
		base: process.cwd(),
		candidates: ["./package.json"],
		fs: ctx.repo.nodeishFs,
	})

	const svelteConfigPath = await findFile({
		base: process.cwd(),
		candidates: ["./svelte.config.js", "./svelte.config.mjs", "./svelte.config.ts"],
		fs: ctx.repo.nodeishFs,
	})

	const viteConfigPath = await findFile({
		base: process.cwd(),
		candidates: ["./vite.config.js", "./vite.config.mjs", "./vite.config.ts"],
		fs: ctx.repo.nodeishFs,
	})

	const tsconfigPath = await findFile({
		base: process.cwd(),
		candidates: ["./tsconfig.json"],
		fs: ctx.repo.nodeishFs,
	})

	const typescript = tsconfigPath !== undefined

	if (!packageJsonPath) {
		ctx.logger.error(
			"Failed to find a package.json file in the current directory. Please rerun in a SvelteKit project."
		)
		process.exit(1)
	}

	if (!viteConfigPath) {
		ctx.logger.error(
			"Failed to find a Vite Config file in the current directory. Please rerun in a SvelteKit project."
		)
		process.exit(1)
	}

	if (!svelteConfigPath) {
		ctx.logger.error(
			"Failed to find a Svelte Config file in the current directory. Please rerun in a SvelteKit project."
		)
		process.exit(1)
	}

	return {
		...ctx,
		packageJsonPath,
		viteConfigPath,
		svelteConfigPath,
		typescript,
	}
}

async function findFile(args: {
	candidates: string[]
	base: string
	fs: Repository["nodeishFs"]
}): Promise<string | undefined> {
	const promises = args.candidates
		.map((c) => path.resolve(args.base, c))
		.map(async (candidate) => ({
			exists: await fileExists(args.fs, candidate),
			path: candidate,
		}))
	const results = await Promise.all(promises)
	return results.find((result) => result.exists)?.path
}

async function fileExists(fs: Repository["nodeishFs"], path: string): Promise<boolean> {
	try {
		const stat = await fs.stat(path)
		return stat.isFile()
	} catch {
		return false
	}
}
