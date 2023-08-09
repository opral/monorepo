import { parseConfig } from "@inlang/core/config"
import { Command } from "commander"
import { cli } from "../../main.js"
import { log } from "../../utilities.js"
import { getInlang } from "../../utilities/getInlang.js"

export const validate = new Command()
	.command("validate")
	.description("Validate the inlang config.")
	.action(validateCommandAction)

export async function validateCommandAction() {
	try {
		// Get the config
		const [inlang, error] = await getInlang({ options: cli.opts() })
		if (error) {
			log.error(error)
			return
		}

		log.info("🔎 Validating the config file...")

		await parseConfig({ config })

		log.success("🎉 Inlang config is valid!")
	} catch (error) {
		log.error(error)
	}
}
