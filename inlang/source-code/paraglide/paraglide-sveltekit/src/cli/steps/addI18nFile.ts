import type { Repository } from "@lix-js/client"
import type { CliStep } from "../utils.js"
import path from "node:path"
import type { Logger } from "@inlang/paraglide-js/internal"

export const addI18nFile: CliStep<
	{
		repo: Repository
		logger: Logger
		typescript: boolean
	},
	unknown
> = async (ctx) => {
	const filePath = path.resolve(process.cwd(), "./src/lib/i18n" + (ctx.typescript ? ".ts" : ".js"))

	const boilerplate = `// file initialized by the Paraglide-SvelteKit CLI - Feel free to edit it
import { createI18n } from "@inlang/paraglide-sveltekit"
import * as runtime from "${"$"}lib/paraglide/runtime.js"

export const i18n = createI18n(runtime)
`

	await ctx.repo.nodeishFs.writeFile(filePath, boilerplate)
	return ctx
}
