import { Command } from "commander"
import fs from "node:fs"
import { resolve } from "node:path"
import { Logger } from "~/services/logger/index.js"
import { runCompiler } from "~/cli/steps/run-compiler.js"
import { DEFAULT_OUTDIR } from "~/cli/defaults.js"
import { loadProjectFromDirectory } from "@inlang/sdk2"

export const compileCommand = new Command()
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

		const project = await loadProjectFromDirectory({ path, fs })

		await runCompiler({
			project,
			fs: fs.promises,
			outdir: options.outdir,
		})

		logger.success("Successfully compiled the project.")

		const errors = await project.errors.get()

		if (errors.length > 0) {
			logger.warn(
				`But the project reported the following warnings and/or errors that might have influenced compilation:`
			)
			for (const error of errors) {
				logger.log(`${error}`)
			}
		}

		process.exit(0)
	})
