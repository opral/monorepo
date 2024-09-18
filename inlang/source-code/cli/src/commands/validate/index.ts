import { Command } from "commander"
import { getInlangProject } from "../../utilities/getInlangProject.js"
import { log } from "../../utilities/log.js"
import { projectOption } from "../../utilities/globalFlags.js"
import { resolve } from "node:path"

export const validate = new Command()
	.command("validate")
	.description("Validate the inlang project settings file.")
	.requiredOption(projectOption.flags, projectOption.description)
	.action(validateCommandAction)

export async function validateCommandAction(args: { project: string }) {
	try {
		log.info("🔎 Validating the inlang project...")
		// if `getInlangProject` doesn't throw, the project is valid
		await getInlangProject({ projectPath: args.project })
		log.success(`Opened project at ${resolve(process.cwd(), args.project)}`)

		log.success("The project is valid!")
	} catch (error) {
		log.error(error)
	}
}
