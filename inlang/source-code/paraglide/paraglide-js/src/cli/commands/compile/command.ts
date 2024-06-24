import { loadProject } from "@inlang/sdk"
import { Command } from "commander"
import nodeFsPromises from "node:fs/promises"
import { resolve } from "node:path"
import { Logger } from "~/services/logger/index.js"
import { openRepository, findRepoRoot } from "@lix-js/client"
import { runCompiler } from "~/cli/steps/run-compiler.js"
import { DEFAULT_OUTDIR } from "~/cli/defaults.js"
import { classifyProjectErrors } from "~/services/error-handling.js"

export const compileCommand = new Command()
	.name("compile")
	.summary("Compiles inlang Paraglide-JS.")
	.requiredOption("--project <path>", 'The path to the inlang project. Example: "./project.inlang"')
	.requiredOption(
		"--outdir <path>",
		'The path to the output directory. Example: "./src/paraglide"',
		DEFAULT_OUTDIR
	)
	.requiredOption("--silent", "Only log errors to the console", false)
	.requiredOption("--watch", "Watch for changes and recompile.", false)
	.action(async (options: { silent: boolean; project: string; outdir: string; watch: boolean }) => {
		const logger = new Logger({ silent: options.silent, prefix: true })
		const path = resolve(process.cwd(), options.project)

		logger.info(`Compiling inlang project at "${options.project}".`)

		const repoRoot = await findRepoRoot({ nodeishFs: nodeFsPromises, path })
		const repo = await openRepository(repoRoot || "file://" + process.cwd(), {
			nodeishFs: nodeFsPromises,
		})

		if (!repoRoot) {
			logger.warn(`Could not find repository root for path ${path}`)
		}

		const project = await loadProject({
			projectPath: path,
			repo,
			appId: PARJS_MARKTEPLACE_ID,
		})

		if (project.errors().length > 0) {
			const { nonFatalErrors, fatalErrors } = classifyProjectErrors(project.errors())
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
			repo,
			outdir: options.outdir,
		})

		if (options.watch) {
			process.on("SIGINT", () => {
				//start with a new line, since the ^C is on the current line
				process.exit(0)
			})

			let numChanges = 0
			project.query.messages.getAll.subscribe(async (messages) => {
				numChanges++
				if (messages.length === 0) return //messages probably haven't loaded yet
				if (numChanges === 1) return //don't recompile on the first run

				logger.info("Messages changed. Recompiling...")
				await runCompiler({
					project,
					repo,
					outdir: options.outdir,
				})
			})

			/* eslint-disable no-constant-condition */
			while (true) {
				// Keep the process alive
				await new Promise((resolve) => setTimeout(resolve, 10_000))
			}
		}

		logger.info("Successfully compiled the project.")
	})
