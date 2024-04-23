import type { Repository } from "@lix-js/client"
import type { CliStep } from "../../utils"
import type { Logger } from "@inlang/paraglide-js/internal"
import type { InlangProject } from "@inlang/sdk"
import { NextJSProject } from "../scan-next-project"

export const addI18nToNextConfig: CliStep<
	{
		repo: Repository
		logger: Logger
		project: InlangProject
		nextProject: NextJSProject
	},
	unknown
> = async (ctx) => {
	const configFile = await ctx.repo.nodeishFs.readFile(ctx.nextProject.configFile.path, {
		encoding: "utf-8",
	})

	return ctx
}
