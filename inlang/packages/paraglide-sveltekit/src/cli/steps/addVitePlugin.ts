import type { Repository } from "@lix-js/client"
import type { CliStep } from "../utils.js"
import type { Logger } from "@inlang/paraglide-js/cli"

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

		const result = maybeUpdateViteConfig(fileContent)
		if (result.ok) {
			await ctx.repo.nodeishFs.writeFile(ctx.viteConfigPath, result.updated)
			ctx.logger.success("Added @inlang/paraglide-sveltekit/vite vite-plugin to vite config")
		} else {
			const msg = [
				"Failed to add the `@inlang/paraglide-sveltekit/vite` vite-plugin in vite.config.js.",
				"Reason: " + result.reason,
				"",
				"Please add the plugin manually.",
			].join("\n")

			ctx.logger.warn(msg)
			return ctx
		}
	} catch (e) {
		ctx.logger.error(
			`Failed to add @inlang/paraglide-sveltekit/vite vite-plugin to ${ctx.viteConfigPath}.`
		)
		process.exit(1)
	}

	return ctx
}

type UpdateResult =
	| {
			ok: true
			updated: string
			reason?: undefined
	  }
	| {
			ok: false
			reason: string
			updated?: undefined
	  }

/**
 * @private Only exported for testings
 */
export function maybeUpdateViteConfig(config: string): UpdateResult {
	if (config.includes("@inlang/paraglide-sveltekit/vite")) {
		return {
			ok: false,
			reason: "Already present",
		}
	}

	const PLUGINS_REGEX = /plugins\s*:\s*\[/g
	const match = PLUGINS_REGEX.exec(config)

	if (!match) {
		return {
			ok: false,
			reason: "Could not find the plugins array",
		}
	}

	const endIndex = match.index + match[0].length
	const before = config.slice(0, endIndex)
	const after = config.slice(endIndex)

	const updatedConfig =
		"import { paraglide } from '@inlang/paraglide-sveltekit/vite'\n" +
		before +
		`paraglide({ project: './project.inlang', outdir: './src/lib/paraglide' }),` +
		after

	return {
		ok: true,
		updated: updatedConfig,
	}
}
