import { Command } from "commander"
import Table from "cli-table3"
import { getInlangProject } from "../../utilities/getInlangProject.js"
import { log } from "../../utilities/log.js"
import { LanguageTag, type InlangProject } from "@inlang/sdk"
import { projectOption } from "../../utilities/globalFlags.js"

export const lint = new Command()
	.command("lint")
	.description("Commands for linting translations.")
	.requiredOption(projectOption.flags, projectOption.description)
	.option("--languageTags <languageTags>", "Comma separated list of language tags to lint.")
	.option("--no-fail", "Disable throwing an error if linting fails.")
	.action(async (args: { project: string }) => {
		const project = await getInlangProject({ projectPath: args.project })
		await lintCommandAction({ project, logger: log })
	})

export async function lintCommandAction(args: { project: InlangProject; logger: any }) {
	try {
		const options = lint.opts()

		if (args.project.installed.messageLintRules().length === 0) {
			args.logger.error(
				`No message lint rules are installed. Visit the marketplace to install lint rules https://inlang.com/ .`
			)
			return
		}

		const languageTags: LanguageTag[] = options.languageTags ? options.languageTags.split(",") : []

		let reports = await args.project.query.messageLintReports.getAll()

		if (reports.length === 0) {
			args.logger.success("Linting successful.")
			return
		}

		if (languageTags.length > 0) {
			const projectLanguageTags = args.project.settings().languageTags
			const languageTagsValid = languageTags.every((tag) => projectLanguageTags.includes(tag))
			if (!languageTagsValid) {
				args.logger.error(
					`Some or all of the language tags "${languageTags}" are not included in the project settings languageTags. Possible language tags are ${projectLanguageTags}.`
				)
				return
			}

			reports = reports.filter((report) => languageTags.includes(report.languageTag))
		}

		// Map over lints with correct log function
		const lintTable = new Table({
			head: ["Level", "Lint Rule", "Message"],
			colWidths: [12, 35, 50],
			wordWrap: true,
		})

		let hasError = false

		for (const lint of reports) {
			const message = typeof lint.body === "object" ? lint.body.en : lint.body
			if (lint.level === "error") {
				hasError = true
				lintTable.push(["Error", lint.ruleId, message])
			} else if (lint.level === "warning") {
				lintTable.push(["Warning", lint.ruleId, message])
			}
		}

		args.logger.log("") // spacer line
		args.logger.log("🚨 Lint Report")
		args.logger.log(lintTable.toString())

		// create summary table with total number of errors and warnings
		const summaryTable = new Table({
			head: ["Level", "Count"],
		})

		summaryTable.push(["Error", reports.filter((lint) => lint.level === "error").length])
		summaryTable.push(["Warning", reports.filter((lint) => lint.level === "warning").length])

		args.logger.log("") // spacer line
		args.logger.log("📊 Summary")
		args.logger.log(summaryTable.toString())

		if (hasError && options.fail) {
			// spacer line
			args.logger.log("")
			args.logger.info(
				"ℹ️  You can add the `--no-fail` flag to disable throwing an error if linting fails."
			)
			console.error("🚫 Lint failed with errors.")
			process.exitCode = 1
		}
		return { lintTable, summaryTable }
	} catch (error) {
		args.logger.error(error)
		return
	}
}
