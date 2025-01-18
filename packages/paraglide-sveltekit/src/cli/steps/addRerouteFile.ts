import type { Repository } from "@lix-js/client"
import type { Logger } from "@inlang/paraglide-js/cli"
import { findFile, type CliStep } from "../utils.js"
import path from "node:path"

const BOILERPLATE = `// file initialized by the Paraglide-SvelteKit CLI - Feel free to edit it
import { i18n } from "${"$"}lib/i18n"

export const reroute = i18n.reroute()
`

export const addRerouteHook: CliStep<
	{ repo: Repository; logger: Logger; typescript: boolean },
	unknown
> = async (ctx) => {
	const hooksFilePath = await findFile({
		candidates: ["./src/hooks.js", "./src/hooks.ts"],
		base: process.cwd(),
		fs: ctx.repo.nodeishFs,
	})

	// if there isn't yet a file there, create one
	if (!hooksFilePath) {
		const hooksFilePath = path.resolve(
			process.cwd(),
			"./src/hooks" + (ctx.typescript ? ".ts" : ".js")
		)

		await ctx.repo.nodeishFs.writeFile(hooksFilePath, BOILERPLATE)
		ctx.logger.success("Added reroute hook")
	} else {
		ctx.logger.warn(
			[
				"Could not add reroute hook because the hooks file already exists",
				"Please add the reroute hook manually",
				"`export const reroute = i18n.reroute()`",
			].join("\n")
		)
	}

	return ctx
}
