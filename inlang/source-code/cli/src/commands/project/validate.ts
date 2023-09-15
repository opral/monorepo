import { Command } from "commander"
import { getInlangProject } from "../../utilities/getInlangProject.js"
import { log } from "../../utilities/log.js"

export const validate = new Command()
	.command("validate")
	.description("Validate the inlang config.")
	.action(validateCommandAction)

export async function validateCommandAction() {
	try {
		log.info("🔎 Validating the config file...")

		// Get the config
		const { error } = await getInlangProject()
		if (error) {
			log.error(error)
			return
		}

		log.success("🎉 Inlang config is valid!")
	} catch (error) {
		log.error(error)
	}
}
