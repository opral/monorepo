import { loadProject, type InlangProject } from "@inlang/sdk"
import consola from "consola"
import { compile } from "../../compiler/compile.js"
import fs from "node:fs/promises"
import { resolve } from "node:path"
import { Command } from "commander"
import { telemetry } from "../../services/telemetry/implementation.js"
import { writeOutput } from "../../services/file-handling/write-output.js"

export const compileCommand = new Command()
	.name("compile")
	.summary("Compiles inlang Paraglide-JS.")
	.requiredOption(
		"--project <path>",
		'The path to the inlang project. Example: "./project.inlang.json"'
	)
	.requiredOption(
		"--outdir <path>",
		'The path to the output directory. Example: "./src/paraglide"',
		"./src/paraglide"
	)
	.requiredOption("--watch", "Watch for changes and recompile.", false)
	.action(async (options: { project: string; outdir: string; watch: boolean }) => {
		consola.info(`Compiling inlang project at "${options.project}".`)

		const settingsFilePath = resolve(process.cwd(), options.project)
		const outputDirectory = resolve(process.cwd(), options.outdir)

		const project = exitIfErrors(
			await loadProject({
				settingsFilePath,
				nodeishFs: fs,
				_capture(id, props) {
					telemetry.capture({
						// @ts-ignore the event types
						event: id,
						properties: props,
					})
				},
			})
		)

		async function execute() {
			const output = compile({
				messages: project.query.messages.getAll(),
				settings: project.settings(),
			})

			await writeOutput(outputDirectory, output, fs)
		}

		await execute()

		// await Promise that never resolves to keep the process alive
		if (options.watch) {

			process.on("SIGINT", () => {
				console.log("")
				consola.info("Stopping the watcher.")
				process.exit(0)
			})

			project.query.messages.getAll.subscribe(async (messages) => {
				consola.info("Messages changed, recompiling...")
				await execute()
			})

			while (true) {
				// Keep the process alive
				await new Promise((resolve) => setTimeout(resolve, 10_000))
			}
		}
		consola.success("Successfully compiled the project.")
	})

/**
 * Utility function to exit when the project has errors.
 */
const exitIfErrors = (project: InlangProject) => {
	if (project.errors().length > 0) {
		consola.warn(`The project has errors:`)
		for (const error of project.errors()) {
			consola.error(error)
		}
		process.exit(1)
	}
	return project
}
