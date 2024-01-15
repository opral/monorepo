import { loadProject, type InlangProject } from "@inlang/sdk"
import { compile } from "../../compiler/compile.js"
import nodeFsPromises from "node:fs/promises"
import { resolve } from "node:path"
import { Command } from "commander"
import { telemetry } from "../../services/telemetry/implementation.js"
import { writeOutput } from "../../services/file-handling/write-output.js"
import { Logger } from "../../services/logger/index.js"
import { openRepository, findRepoRoot } from "@lix-js/client"
// TODO add a project UUID to the tele.groups internal #196
// import { gitOrigin } from "../../services/telemetry/implementation.js"

export const compileCommand = new Command()
	.name("compile")
	.summary("Compiles inlang Paraglide-JS.")
	.requiredOption("--project <path>", 'The path to the inlang project. Example: "./project.inlang"')
	.requiredOption(
		"--outdir <path>",
		'The path to the output directory. Example: "./src/paraglide"',
		"./src/paraglide"
	)
	.requiredOption("--watch", "Watch for changes and recompile.", false)
	.action(async (options: { project: string; outdir: string; watch: boolean }) => {
		const logger = new Logger({ silent: false, prefix: true })
		const path = resolve(process.cwd(), options.project)
		const outputDirectory = resolve(process.cwd(), options.outdir)

		logger.info(`Compiling inlang project at "${options.project}".`)
		// TODO add a project UUID to the tele.groups internal #196
		// telemetry.groupIdentify({
		// 	groupType: "repository",
		// 	groupKey: gitOrigin,
		// 	properties: {
		// 		name: gitOrigin,
		// 	},
		// })

		const repoRoot = await findRepoRoot({ nodeishFs: nodeFsPromises, path })

		let project: Awaited<ReturnType<typeof loadProject>>
		if (!repoRoot) {
			logger.warn(`Could not find repository root for path ${path}`)
			// We still support projects without git repo for now.

			const repo = await openRepository("file://", {
				nodeishFs: nodeFsPromises,
			})

			project = exitIfErrors(
				await loadProject({
					projectPath: path,
					repo,
					_capture(id, props) {
						telemetry.capture({
							// @ts-ignore the event types
							event: id,
							properties: props,
						})
					},
				}),
				logger
			)
		} else {
			const repo = await openRepository(repoRoot, {
				nodeishFs: nodeFsPromises,
			})

			project = exitIfErrors(
				await loadProject({
					projectPath: path,
					repo,
					_capture(id, props) {
						telemetry.capture({
							// @ts-ignore the event types
							event: id,
							properties: props,
						})
					},
				}),
				logger
			)
		}

		async function execute() {
			const output = compile({
				messages: project.query.messages.getAll(),
				settings: project.settings(),
			})

			await writeOutput(outputDirectory, output, nodeFsPromises)
		}

		await execute()

		// await Promise that never resolves to keep the process alive
		if (options.watch) {
			process.on("SIGINT", () => {
				//start with a new line, since the ^C is on the current line
				logger.ln().info("Stopping the watcher.")
				process.exit(0)
			})

			let numChanges = 0
			project.query.messages.getAll.subscribe(async (messages) => {
				numChanges++
				if (messages.length === 0) return //messages probably haven't loaded yet
				if (numChanges === 1) return //don't recompile on the first run

				logger.info("Messages changed. Recompiling...")
				await execute()
			})

			/* eslint-disable no-constant-condition */
			while (true) {
				// Keep the process alive
				await new Promise((resolve) => setTimeout(resolve, 10_000))
			}
		}

		logger.info("Sucessfully compiled the project.")
	})

/**
 * Utility function to exit when the project has errors.
 */
const exitIfErrors = (project: InlangProject, logger: Logger) => {
	if (project.errors().length > 0) {
		logger.warn(`The project has errors:`)
		for (const error of project.errors()) {
			logger.error(error)
		}
		process.exit(1)
	}
	return project
}
