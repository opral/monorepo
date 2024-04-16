import type { Logger } from "~/services/logger/index.js"
import type { CliStep } from "../cli-utils.js"
import { execAsync, prompt } from "../utils.js"

export const checkForUncommittedChanges: CliStep<{ logger: Logger }, unknown> = async (ctx) => {
	try {
		if ((await execAsync("git status --porcelain")).toString().length === 0) {
			return ctx
		}

		ctx.logger.info(
			`You have uncommitted changes.\n\nPlease commit your changes before initializing inlang Paraglide-JS. Committing outstanding changes ensures that you don't lose any work, and see the changes the paraglide-js init command introduces.`
		)
		const response = await prompt(
			"Do you want to initialize inlang Paraglide-JS without committing your current changes?",
			{
				type: "confirm",
				initial: false,
			}
		)
		if (response === true) {
			return ctx
		} else {
			process.exit(0)
		}
	} catch (e) {
		// git cli is not installed
		return ctx
	}
}
