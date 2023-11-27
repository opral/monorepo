import { createUnplugin } from "unplugin"
import { Message, ProjectSettings, loadProject, type InlangProject } from "@inlang/sdk"
import path from "node:path"
import fs from "node:fs/promises"
import { compile, writeOutput } from "@inlang/paraglide-js/internal"
import type { Logger } from "vite"
import color from "kleur"

const PLUGIN_NAME = "unplugin-paraglide"

export type UserConfig = {
	project: string
	outdir: string
	silent?: boolean
}

export const paraglide = createUnplugin((config: UserConfig) => {
	const options = {
		silent: false,
		...config,
	}

	const outputDirectory = path.resolve(process.cwd(), options.outdir)
	let logger: Logger | undefined = undefined

	//Keep track of how many times we've compiled
	let numCompiles = 0

	async function triggerCompile(messages: readonly Message[], settings: ProjectSettings) {
		if (messages.length === 0) return //messages probably haven't loaded yet
		logMessageChange()
		const output = compile({ messages, settings })
		await writeOutput(outputDirectory, output, fs)
		numCompiles++
	}

	function logMessageChange() {
		if (!logger) return
		if (options.silent) return

		if (numCompiles === 0) {
			logger.info(
				`${color.bold().blue("ℹ [paraglide]")} Compiling Messages into ${color.italic(
					options.outdir
				)}`
			)
		}

		if (numCompiles >= 1) {
			logger.info(
				`${color.bold().blue("ℹ [paraglide]")} Messages changed - Recompiling into ${color.italic(
					options.outdir
				)}`
			)
		}
	}

	let project: InlangProject | undefined = undefined
	async function getProject(): Promise<InlangProject> {
		if (project) return project
		project = await loadProject({
			projectPath: path.resolve(process.cwd(), options.project),
			nodeishFs: fs,
		})
		return project
	}

	return {
		name: PLUGIN_NAME,

		enforce: "pre",
		async buildStart() {
			const project = await getProject()

			project.query.messages.getAll.subscribe((messages) => {
				triggerCompile(messages, project.settings())
			})
		},

		vite: {
			configResolved(config) {
				logger = config.logger
			},
		},

		webpack(compiler) {
			//we need the compiler to run before the build so that the message-modules will be present
			//In the other bundlers `buildStart` already runs before the build. In webpack it's a race condition
			compiler.hooks.beforeRun.tapPromise(PLUGIN_NAME, async () => {
				const project = await getProject()
				await triggerCompile(project.query.messages.getAll(), project.settings())
				console.info(
					`${color.bold().blue("[paraglide]")} Compiled Messages into ${color.italic(
						options.outdir
					)}`
				)
			})
		},
	}
})
