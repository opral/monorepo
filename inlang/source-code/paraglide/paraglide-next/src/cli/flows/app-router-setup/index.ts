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
import { promptRoutingStrategy } from "./promptRoutingStrategy"
import { InlangProject } from "@inlang/sdk"

export const appRouterSetup: CliStep<
	{
		repo: Repository
		logger: Logger
		outdir: Outdir
		projectPath: string
		project: InlangProject
		nextProject: NextJSProject
	},
	unknown
> = async (ctx) => {
	ctx.logger.info("Setting up Paraglide-Next for the App Router")
	const ctx1 = await promptRoutingStrategy(ctx)
	await createI18nFile(ctx1)
	await createMiddlewareFile(ctx1)
	await addLanguageProvider(ctx1)
	await addParaglideNextPluginToNextConfig(ctx1)
	await maybeMigrateI18nRouting(ctx1)
	return ctx1
}
