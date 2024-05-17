import type { Repository } from "@lix-js/client"
import type { CliStep } from "../utils.js"
import type { Logger } from "@inlang/paraglide-js/internal"

export const addParaglideSvelteKitVitePlugin: CliStep<
	{
		repo: Repository
		logger: Logger
		viteConfigPath: string
	},
	unknown
> = async (ctx) => {
	try {
		const fileContent = await ctx.repo.nodeishFs.readFile(ctx.viteConfigPath, {
			encoding: "utf-8",
		})

		const PLUGINS_REGEX = /plugins\s*:\s*\[/g
		const match = PLUGINS_REGEX.exec(fileContent)

		if (!match) {
			ctx.logger.warn(
				"Failed to add the @inlang/paraglide-sveltekit/vite vite-plugin. You will need to do it manually"
			)
			return ctx
		}

		const endIndex = match.index + match.length

		const before = fileContent.slice(0, match.index)
		const after = fileContent.slice(endIndex)

		const newFileContent =
			"import { paraglide } from '@inlang/paraglide-sveltekit/vite'\n" +
			before +
			`paraglide({ project: './project.inlang', outdir: './src/lib/paraglide' }),` +
			after

		await ctx.repo.nodeishFs.writeFile(ctx.viteConfigPath, newFileContent)

        ctx.logger.success("Added @inlang/paraglide-sveltekit/vite vite-plugin to vite config")
	} catch (e) {
		ctx.logger.error(
			`Failed to add @inlang/paraglide-sveltekit/vite vite-plugin to ${ctx.viteConfigPath}.`
		)
		process.exit(1)
	}

	return ctx
}
