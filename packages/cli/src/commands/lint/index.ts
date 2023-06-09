import { getLintReports, lint as _lint, LintReport } from "@inlang/core/lint"
import { Command } from "commander"
import { log } from "../../utilities.js"
import { getConfig } from "../../utilities/getConfig.js"

export const lint = new Command()
	.command("lint")
	.description("Commands for linting translations.")
	.action(lintCommandAction)

async function lintCommandAction() {
	try {
		// Get the config
		const [config, errorMessage] = await getConfig()
		if (!config) {
			log.error(errorMessage)
			return
		}

		log.info(
			"ℹ️  For this command to work, you need lint rules configured in your inlang.config.js – for example, through the https://github.com/inlang/plugin-standard-lint-rules plugin.",
		)

		const resources = await config.readResources({ config })

		// Get ressources with lints
		const [resourcesWithLints, errors] = await _lint({ resources, config })
		if (errors) {
			console.error(
				"🚫 Lints partially failed. Please check if you have your lint rules configured correctly.",
				errors && errors,
			)
		}

		// get lint report
		const lints = getLintReports(resourcesWithLints)

		const bold = (text: string) => `\x1b[1m${text}\x1b[0m`
		const italic = (text: string) => `\x1b[3m${text}\x1b[0m`

		// map over lints with correct log function
		lints.map((lint: LintReport) => {
			switch (lint.level) {
				case "error":
					log.error(`Id: ${bold(lint.id)}, Message: ${italic(lint.message)}`)
					break
				case "warn":
					log.error(`Id: ${bold(lint.id)}, Message: ${italic(lint.message)}`)
					break
				default:
					log.info(`Id: ${bold(lint.id)}, Message: ${italic(lint.message)}`)
					break
			}
		})

		if (!lints.length) {
			log.info("🎉 Everything translated correctly.")
		}
	} catch (error) {
		log.error(error)
	}
}
