import { Command } from "commander"
import { getInlangProject } from "../../utilities/getInlangProject.js"
import { log } from "../../utilities/log.js"

export const validate = new Command()
	.command("validate")
	.description("Validate the inlang prokect settings file.")
	.action(validateCommandAction)

export async function validateCommandAction() {
	try {
		log.info("🔎 Validating the project settings file...")
		// if `getInlangProject` doesn't return, the project is valid
		await getInlangProject()
		log.success("The project settings file is valid!")
	} catch (error) {
		log.error(error)
	}
}
