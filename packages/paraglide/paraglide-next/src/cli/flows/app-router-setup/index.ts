import { Repository } from "@lix-js/client"
import { CliStep } from "../../utils"
import { NextJSProject } from "../scan-next-project"
import { createI18nFile } from "./createI18nFile"
import { createMiddlewareFile } from "./createMiddlewareFile"
import { addLanguageProvider } from "./addLanguageProvider"
import { addParaglideNextPluginToNextConfig } from "../addPluginToNextConfig"
import { maybeMigrateI18nRouting } from "./maybeMigrateI18nRouting"
import { Logger } from "@inlang/paraglide-js/internal"
import { Outdir } from "../getOutDir"

export const appRouterSetup: CliStep<
	{
		repo: Repository
		logger: Logger
		outdir: Outdir
		projectPath: string
		nextProject: NextJSProject
	},
	unknown
> = async (ctx) => {
	ctx.logger.info("Setting up Paraglide-Next for the App Router")
	await createI18nFile(ctx)
	await createMiddlewareFile(ctx)
	await addLanguageProvider(ctx)
	await addParaglideNextPluginToNextConfig(ctx)
	await maybeMigrateI18nRouting(ctx)
	return ctx
}
