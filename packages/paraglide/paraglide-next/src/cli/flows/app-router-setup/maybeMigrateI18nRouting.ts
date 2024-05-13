import { Repository } from "@lix-js/client"
import { CliStep } from "../../utils"
import { Logger } from "@inlang/paraglide-js/internal"
import { NextJSProject } from "../scan-next-project"
import { SetUpI18nRoutingFlow } from "../set-up-i18n-routing"
import consola from "consola"

export const maybeMigrateI18nRouting: CliStep<
	{
		repo: Repository
		logger: Logger
		nextProject: NextJSProject
	},
	unknown
> = async (ctx) => {
	const response = await consola.prompt(
		"Do you want to update your <Link>s for localised routing? (recommended)\nThis will replace any imports from next/link and next/navigation with their localised counterparts",
		{
			type: "confirm",
			initial: true,
		}
	)

	if (!response) return ctx
	try {
		return await SetUpI18nRoutingFlow({ ...ctx, srcRoot: ctx.nextProject.srcRoot })
	} catch (e) {
		ctx.logger.error("Failed to set up i18n routing. You'll have to do it manually")
		return ctx
	}
}
