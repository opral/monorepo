import { getLintReports, lint as _lint } from "@inlang/core/lint"
import { Command } from "commander"
import { cli } from "../../main.js"
import { log } from "../../utilities.js"
import Table from "cli-table3"
import { getConfig } from "../../utilities/getConfig.js"

export const lint = new Command()
	.command("lint")
	.description("Commands for linting translations.")
	.option("--no-fail", "Disable throwing an error if linting fails.") // defaults to false https://github.com/tj/commander.js#other-option-types-negatable-boolean-and-booleanvalue
	.action(lintCommandAction)

async function lintCommandAction() {
	try {
		// Get the config
		const [config, errorMessage] = await getConfig({ options: cli.opts() })
		if (!config) {
			log.error(errorMessage)
			return
		}

		log.info(
			"ℹ️  For this command to work, you need lint rules configured in your `inlang.config.js` – for example, through the https://github.com/inlang/plugin-standard-lint-rules plugin.",
		)

		const resources = await config.readResources({ config })

		// Get resources with lints
		const [resourcesWithLints, errors] = await _lint({ resources, config })
		if (errors) {
			console.error(
				"🚫 Lints partially failed. Please check if you have your lint rules configured correctly.",
				errors && errors,
			)
		}

		// Get lint report
		const lints = getLintReports(resourcesWithLints)

		if (lints.length === 0) {
			log.success("🎉 Everything translated correctly.")
			return
		}

		// Map over lints with correct log function
		const lintTable = new Table({
			head: ["Level", "Lint Rule", "Message"],
			colWidths: [12, 35, 50],
			wordWrap: true,
		})

		let hasError = false

		for (const lint of lints) {
			if (lint.level === "error") {
				hasError = true
				lintTable.push(["Error", lint.id, lint.message])
			} else if (lint.level === "warn") {
				lintTable.push(["Warning", lint.id, lint.message])
			}
		}

		log.log("🚨 Lint Report")
		log.log(lintTable.toString())

		// create summary table with total number of errors and warnings
		const summaryTable = new Table({
			head: ["Level", "Count"],
		})

		summaryTable.push(["Error", lints.filter((lint) => lint.level === "error").length])
		summaryTable.push(["Warning", lints.filter((lint) => lint.level === "warn").length])

		log.log("📊 Summary")
		log.log(summaryTable.toString())

		if (hasError && lint.opts().fail) {
			log.info(
				"ℹ️  You can add the `--no-fail` flag to disable throwing an error if linting fails.",
			)
			throw new Error("🚫 Lint failed with errors.")
		}
	} catch (error) {
		log.error(error)
	}
}
