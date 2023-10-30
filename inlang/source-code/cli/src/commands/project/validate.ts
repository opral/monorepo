import { Command } from "commander"
import { getInlangProject } from "../../utilities/getInlangProject.js"
import { log } from "../../utilities/log.js"

export const validate = new Command()
	.command("validate")
	.description("Validate the inlang prokect settings file.")
	.requiredOption("--project <path>", "Path to the project settings file.", "./project.inlang.json")
	.action((args: { project: string }) => {
		validateCommandAction({ project: args.project })
	})

export async function validateCommandAction(args: { project: string }) {
	try {
		log.info("🔎 Validating the project settings file...")
		// if `getInlangProject` doesn't return, the project is valid
		await getInlangProject({ projectPath: args.project })
		log.success("The project settings file is valid!")
	} catch (error) {
		log.error(error)
	}
}
