import { parseConfig } from "@inlang/core/config"
import { Command } from "commander"
import { log } from "../../utilities.js"
import { getConfig } from "../../utilities/getConfig.js"

export const validate = new Command()
	.command("validate")
	.description("Validate the inlang config.")
	.action(validateCommandAction)

async function validateCommandAction() {
	try {
		// Get the config
		const config = await getConfig()
		if (!config) {
			// no message because that's handled in getConfig
			return
		}

		log.info("ℹ️  Validating the config ...")

		await parseConfig({ config })

		log.info("🎉 Inlang config is valid!")
	} catch (error) {
		log.error(error)
	}
}
