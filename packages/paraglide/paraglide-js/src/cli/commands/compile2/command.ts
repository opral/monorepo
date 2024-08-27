import { Command } from "commander"
import nodeFsPromises from "node:fs/promises"
import { resolve } from "node:path"
import { Logger } from "~/services/logger/index.js"
import { runCompiler } from "~/cli/steps/run-compiler2.js"
import { DEFAULT_OUTDIR } from "~/cli/defaults.js"
import { classifyProjectErrors } from "~/services/error-handling.js"
import { loadProjectFromDirectoryInMemory } from "@inlang/sdk2"

export const compileCommand2 = new Command()
	.name("compile")
	.summary("Compiles inlang Paraglide-JS")
	.requiredOption("--project <path>", 'The path to the inlang project. Example: "./project.inlang"')
	.requiredOption(
		"--outdir <path>",
		'The path to the output directory. Example: "./src/paraglide"',
		DEFAULT_OUTDIR
	)
	.requiredOption("--silent", "Only log errors to the console", false)
	.action(async (options: { silent: boolean; project: string; outdir: string; watch: boolean }) => {
		const logger = new Logger({ silent: options.silent, prefix: true })
		const path = resolve(process.cwd(), options.project)

		logger.info(`Compiling inlang project at "${options.project}".`)

		const project = await loadProjectFromDirectoryInMemory({
			path,
			fs: nodeFsPromises,
		})

		const errors = project.errors.get()

		if (errors.length > 0) {
			const { nonFatalErrors, fatalErrors } = classifyProjectErrors(errors as any)
			if (fatalErrors.length > 0) {
				logger.error(`The project has fatal errors:`)
				for (const error of [...fatalErrors, ...nonFatalErrors]) {
					logger.error(error)
				}
				process.exit(1)
			}

			if (nonFatalErrors.length > 0) {
				logger.warn(`The project has warnings:`)
				for (const error of nonFatalErrors) {
					logger.warn(error)
				}
			}
		}

		await runCompiler({
			project,
			fs: nodeFsPromises,
			outdir: options.outdir,
		})

		logger.info("Successfully compiled the project.")
		process.exit(0)
	})
