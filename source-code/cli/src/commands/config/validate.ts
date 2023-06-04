import { parseConfig } from "@inlang/core/config"
import { Command } from "commander"
import { log } from "../../utilities.js"
import { getConfig } from "../../utilities/getConfig.js"

export const validate = new Command()
	.command("validate")
	.description("Validate the inlang config.")
	.action(validateCommandAction)

async function validateCommandAction() {
	log.info("ℹ️  Validating the config ...")

	// Get the config
	const config = await getConfig()
	if (!config) {
		// no message because that's handled in getConfig
		return
	}

	const result = await parseConfig({ config })
	//! TODO: Add proper result handling and logging and docs

	if (result) {
		log.info("🎉 Inlang config is valid!")
	} else {
		log.error("🚫 Something went wrong, please check you inlang.config.js file.")
	}

	return
}
