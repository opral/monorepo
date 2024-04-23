import { Repository } from "@lix-js/client"
import { CliStep } from "../../utils"
import { NextJSProject } from "../scan-next-project"
import { updateNextConfig } from "../updateNextConfig"
import { Logger } from "@inlang/paraglide-js/internal"
import { Outdir } from "../getOutDir"

export const pagesRouterSetup: CliStep<
	{
		repo: Repository
		nextProject: NextJSProject
		logger: Logger
		outdir: Outdir
		projectPath: string
	},
	unknown
> = async (ctx) => {
	ctx.logger.info("Setting up Paraglide-Next for the Pages Router")
	await updateNextConfig(ctx)
	return ctx
}
