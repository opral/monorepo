import type { Repository } from "@lix-js/client"
import type { CliStep } from "../../utils"
import type { NextJSProject } from "../scan-next-project"
import type { Logger } from "@inlang/paraglide-js/internal"
import type { Outdir } from "../getOutDir"
import type { InlangProject } from "../../../../../../sdk/dist/api"
import { addParaglideNextPluginToNextConfig } from "../addPluginToNextConfig"
import { addI18nToNextConfig } from "./addI18nToNextConfig"

export const pagesRouterSetup: CliStep<
	{
		repo: Repository
		nextProject: NextJSProject
		logger: Logger
		outdir: Outdir
		projectPath: string
		project: InlangProject
	},
	unknown
> = async (ctx) => {
	ctx.logger.info("Setting up Paraglide-Next for the Pages Router")
	await addI18nToNextConfig(ctx)
	await addParaglideNextPluginToNextConfig(ctx)
	return ctx
}
