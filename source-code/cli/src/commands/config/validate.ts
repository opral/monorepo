import { parseConfig } from "@inlang/core/config"
import { Command } from "commander"
import { cli } from "../../main.js"
import { log } from "../../utilities.js"
import { getConfig } from "../../utilities/getConfig.js"

export const validate = new Command()
	.command("validate")
	.description("Validate the inlang config.")
	.action(validateCommandAction)

async function validateCommandAction() {
	try {
		// Get the config
		const [config, errorMessage] = await getConfig({ options: cli.opts() })
		if (errorMessage) {
			log.error(errorMessage)
			return
		}

		log.info("ℹ️  Validating the config ...")

		await parseConfig({ config })

		log.success("🎉 Inlang config is valid!")
	} catch (error) {
		log.error(error)
	}
}
