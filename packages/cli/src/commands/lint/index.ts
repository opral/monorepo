import { Command } from "commander"
import Table from "cli-table3"
import { getInlangInstance } from "../../utilities/getInlangInstance.js"
import { bold, italic } from "../../utilities/format.js"
import { log } from "../../utilities/log.js"

export const lint = new Command()
	.command("lint")
	.description("Commands for linting translations.")
	.option("--no-fail", "Disable throwing an error if linting fails.") // defaults to false https://github.com/tj/commander.js#other-option-types-negatable-boolean-and-booleanvalue
	.action(lintCommandAction)

async function lintCommandAction() {
	try {
		const { data: inlang, error } = await getInlangInstance()
		if (error) {
			log.error(error)
			return
		}

		if (inlang.meta.lintRules().length === 0) {
			log.error(
				`🚫 For this command to work, you need lint rules configured in your inlang.config.json – for example, the ${bold(
					"@inlang/plugin-standard-lint-rule",
				)} plugin: https://github.com/inlang/inlang/tree/main/source-code/plugins/standard-lint-rules. ${italic(
					"Learn more about lints here:",
				)} https://inlang.com/documentation/lint`,
			)
			return
		}

		// Init linting
		await inlang.lint.init()

		// Get lint reports
		const lintReport = await inlang.lint.reports()

		if (lintReport.length === 0) {
			log.success("🎉 Linting successful.")
			return
		}

		// Map over lints with correct log function
		const lintTable = new Table({
			head: ["Level", "Lint Rule", "Message"],
			colWidths: [12, 35, 50],
			wordWrap: true,
		})

		let hasError = false

		for (const lint of lintReport) {
			if (lint.level === "error") {
				hasError = true
				lintTable.push(["Error", lint.ruleId, lint.body.en])
			} else if (lint.level === "warning") {
				lintTable.push(["Warning", lint.ruleId, lint.body.en])
			}
		}

		log.log("") // spacer line
		log.log("🚨 Lint Report")
		log.log(lintTable.toString())

		// create summary table with total number of errors and warnings
		const summaryTable = new Table({
			head: ["Level", "Count"],
		})

		summaryTable.push(["Error", lintReport.filter((lint) => lint.level === "error").length])
		summaryTable.push(["Warning", lintReport.filter((lint) => lint.level === "warning").length])

		log.log("") // spacer line
		log.log("📊 Summary")
		log.log(summaryTable.toString())

		if (hasError && lint.opts().fail) {
			// spacer line
			log.log("")
			log.info(
				"ℹ️  You can add the `--no-fail` flag to disable throwing an error if linting fails.",
			)
			console.error("🚫 Lint failed with errors.")
			process.exit(1)
		}
	} catch (error) {
		log.error(error)
	}
}
