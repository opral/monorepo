import type { Logger } from "~/services/logger/index.js"
import { DEFAULT_OUTDIR } from "~/cli/defaults.js"
import { prompt } from "~/cli/utils.js"
import type { CliStep } from "../utils.js"

export const promptForOutdir: CliStep<
	{
		logger: Logger
	},
	{
		/** Relative path to the output directory */
		outdir: string
	}
> = async (ctx) => {
	const response = await prompt("Where should the compiled files be placed?", {
		type: "text",
		initial: DEFAULT_OUTDIR,
		default: DEFAULT_OUTDIR,
		placeholder: "Relative path from the package root to the desired compiler output directory",
	})

	if (!response.startsWith("./")) {
		ctx.logger.warn("You must enter a valid relative path starting from the package root.")
		return await promptForOutdir(ctx)
	}

	return {
		...ctx,
		outdir: response,
	}
}
