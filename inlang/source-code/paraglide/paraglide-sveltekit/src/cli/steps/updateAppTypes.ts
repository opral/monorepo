import type { Repository } from "@lix-js/client"
import type { Logger } from "@inlang/paraglide-js/internal"
import { findFile, type CliStep } from "../utils.js"

export const addTypesForLocals: CliStep<
	{
		repo: Repository
		logger: Logger
	},
	unknown
> = async (ctx) => {
	const appDTsFilePath = await findFile({
		base: process.cwd(),
		candidates: ["./src/app.d.ts"],
		fs: ctx.repo.nodeishFs,
	})

	if (!appDTsFilePath) {
		ctx.logger.warn("Could not find the app.d.ts file. Please add it manually.")
		return ctx
	}

	const content = await ctx.repo.nodeishFs.readFile(appDTsFilePath, { encoding: "utf-8" })
	const result = updateAppDTsFile(content)
	if (result.ok) {
		await ctx.repo.nodeishFs.writeFile(appDTsFilePath, result.updated)

		ctx.logger.success("Added Language Provider to src/routes/+layout.svelte")
	} else {
		ctx.logger.warn(
			"Failed to add the ParaglideLocals type to the app.d.ts file. Please add it manually."
		)
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
 * @private
 */
export function updateAppDTsFile(code: string): UpdateResult {
	// add the type import
	if (code.includes("AvailableLanguageTag") || code.includes("ParaglideLocals")) {
		return { ok: false, reason: "Paraglide types already present" }
	}

	code = [
		'import type { AvailableLanguageTag } from "$lib/paraglide/runtime"',
		'import type { ParaglideLocals } from "@inlang/paraglide-sveltekit"',
		code,
	].join("\n")

	const LocalsInterfaceRegex = /interface\s+Locals\s*\{/g
	const match = LocalsInterfaceRegex.exec(code)
	if (!match) {
		return { ok: false, reason: "Could not find the Locals interface" }
	}

	// add the type to the Locals interface
	const endIndex = match.index + match[0].length
	const before = code.slice(0, endIndex)
	const after = code.slice(endIndex)

	const beforeLines = before.split("\n")
	beforeLines[beforeLines.length - 1] = beforeLines.at(-1)?.replace("//", "") || ""

	code =
		beforeLines.join("\n") + "\n    paraglide: ParaglideLocals<AvailableLanguageTag>,\n" + after

	return {
		ok: true,
		updated: code,
	}
}
