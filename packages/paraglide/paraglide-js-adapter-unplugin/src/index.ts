import { createUnplugin } from "unplugin"
import { Message, ProjectSettings, loadProject } from "@inlang/sdk"
import path from "node:path"
import fs from "node:fs/promises"
import { compile, writeOutput } from "@inlang/paraglide-js/internal"
import type { Logger } from "vite"
import color from "kleur"

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

	const execute = async (messages: readonly Message[], settings: ProjectSettings) => {
		const output = compile({ messages, settings })
		await writeOutput(outputDirectory, output, fs)
	}

	let logger: Logger | undefined = undefined

	//Keep track of how many times we've compiled
	let numCompiles = 0

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

	return {
		name: "unplugin-paraglide",

		enforce: "pre",
		async buildStart() {
			const inlang = await loadProject({
				settingsFilePath: path.resolve(process.cwd(), options.project),
				nodeishFs: fs,
			})

			inlang.query.messages.getAll.subscribe((messages) => {
				if (messages.length === 0) return //messages probably haven't loaded yet
				logMessageChange()
				execute(messages, inlang.settings())
				numCompiles++
			})
		},

		vite: {
			configResolved(config) {
				logger = config.logger
			},
		},
	}
})
