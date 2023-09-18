import { Command } from "commander"
import Table from "cli-table3"
import { getInlangProject } from "../../utilities/getInlangProject.js"
import { log } from "../../utilities/log.js"
import type { InlangProject, MessageLintReport } from "@inlang/sdk"

export const lint = new Command()
	.command("lint")
	.description("Commands for linting translations.")
	.option("--no-fail", "Disable throwing an error if linting fails.") // defaults to false https://github.com/tj/commander.js#other-option-types-negatable-boolean-and-booleanvalue
	.action(async () => {
		const { data: project, error } = await getInlangProject()
		if (error) {
			log.error(error)
			return
		}
		await lintCommandAction({ project, logger: log })
	})

/* @ts-ignore */
export async function lintCommandAction(args: { project: InlangProject; logger: any }) {
	try {
		if (args.project.installed.messageLintRules().length === 0) {
			args.logger.error(
				`No message lint rules are installed. Visit the marketplace to install lint rules https://inlang.com/marketplace .`,
			)
			return
		}

		// TODO: async reports
		const MessageLintReportsAwaitable = (): Promise<MessageLintReport[]> => {
			return new Promise((resolve) => {
				let reports = args.project.query.messageLintReports.getAll()

				if (reports) {
					// reports where loaded
					setTimeout(() => {
						// this is a workaround. We do not know when the report changed. Normally this shouldn't be a issue for cli
						const newReports = args.project.query.messageLintReports.getAll()
						if (newReports) {
							resolve(newReports)
						}
					}, 200)
				} else {
					let counter = 0
					const interval = setInterval(() => {
						reports = args.project.query.messageLintReports.getAll()
						if (reports) {
							clearInterval(interval)
							resolve(reports)
						} else {
							counter += 1
						}

						if (counter > 10) {
							clearInterval(interval)
							resolve([])
						}
					}, 200)
				}
			})
		}

		const reports = await MessageLintReportsAwaitable()

		if (reports.length === 0) {
			args.logger.success("🎉 Linting successful.")
			return
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

		if (hasError && lint.opts().fail) {
			// spacer line
			args.logger.log("")
			args.logger.info(
				"ℹ️  You can add the `--no-fail` flag to disable throwing an error if linting fails.",
			)
			console.error("🚫 Lint failed with errors.")
			process.exit(1)
		}

		return { lintTable, summaryTable }
	} catch (error) {
		args.logger.error(error)
	}
}
