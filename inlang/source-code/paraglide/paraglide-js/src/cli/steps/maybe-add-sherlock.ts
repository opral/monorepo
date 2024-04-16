import type { Logger } from "~/services/logger/index.js"
import { prompt } from "~/cli/utils.js"
import type { Repository } from "@lix-js/client"
import type { CliStep } from "../utils.js"
import type { InlangProject } from "@inlang/sdk"
import * as Sherlock from "@inlang/cross-sell-sherlock"

export const maybeAddSherlock: CliStep<
	{
		repo: Repository
		logger: Logger
		project: InlangProject
	},
	unknown
> = async (ctx) => {
	const isCertainlyVsCode = process?.env?.TERM_PROGRAM === "vscode"

	let response = isCertainlyVsCode
	if (!isCertainlyVsCode) {
		response = await prompt(`Are you using Visual Studio Code?`, {
			type: "confirm",
			initial: true,
		})
	}
	if (response === false) return ctx

	const settings = ctx.project.settings()

	// m function matcher is not installed
	if (settings.modules.some((m) => m.includes("plugin-m-function-matcher")) === false) {
		// add the m function matcher plugin
		settings.modules.push(
			"https://cdn.jsdelivr.net/npm/@inlang/plugin-m-function-matcher@latest/dist/index.js"
		)
		ctx.project.setSettings(settings)
	}

	try {
		if (!(await Sherlock.isAdopted({ fs: ctx.repo.nodeishFs }))) {
			await Sherlock.add({ fs: ctx.repo.nodeishFs })

			ctx.logger.success(
				"Added the inlang Visual Studio Code extension (Sherlock) to the workspace recommendations."
			)
		}
	} catch (error) {
		ctx.logger.error(
			"Failed to add the inlang Visual Studio Code extension (Sherlock). Please open an issue"
		)
	}

	return ctx
}
