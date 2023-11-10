import type { PluginOption } from "vite"
import { exec } from "node:child_process"
import { readFile } from "node:fs/promises"
import { loadProject, type ProjectSettings } from "@inlang/sdk"
import { createNodeishMemoryFs } from "@inlang/sdk/test-utilities"
import path from "node:path"

let cachedSettings: ProjectSettings | undefined = undefined

export const i18n = (config: {
	project: string
	outdir: string
	timeout?: number
	onInit?: boolean
}): PluginOption => {
	const options = {
		silent: false,
		onInit: true,
		...config,
	}

	const execute = () => {
		exec(
			`paraglide-js compile --project ${options.project} --outdir ${options.outdir}`,
			(exception, output, error) => {
				// eslint-disable-next-line no-console
				if (!options.silent && output) console.log(output)
				if (!options.silent && error) console.error(error)
			}
		)
	}

	return {
		name: "vite-plugin-paraglide-js-watcher",

		async buildStart() {
			if (!cachedSettings) {
				const settingsContent = await readFile(options.project, "utf-8")
				cachedSettings = JSON.parse(settingsContent)
			}

			if (options.onInit) {
				execute()
			}

			const inlang = await loadProject({
				settingsFilePath: path.resolve(process.cwd(), options.project),
				nodeishFs: createNodeishMemoryFs(),
			})

			inlang.query.messages.getAll.subscribe((messages) => {
				console.log("messages", messages)

				if (messages.length > 0) {
					execute()
				}
			})
		},

		// async handleHotUpdate({ file }) {
		// 	if (throttled) return

		// 	throttled = true

		// 	setTimeout(() => (throttled = false), options.timeout)

		// 	let filePath =
		// 		cachedSettings && (cachedSettings["plugin.inlang.messageFormat"]?.filePath as string)
		// 	if (!filePath) {
		// 		console.warn(
		// 			"No `filePath` found in `project.inlang.json` settings. Skipping paraglide-js compilation."
		// 		)
		// 		return
		// 	}

		// 	if (!filePath.startsWith("/")) {
		// 		filePath = resolve(process.cwd(), filePath)
		// 	}

		// 	if (file === filePath) {
		// 		console.info(
		// 			"Running",
		// 			`paraglide-js compile --namespace ${options.namespace} --project ${options.settingsPath}`,
		// 			"with filePath:",
		// 			filePath,
		// 			"\n"
		// 		)
		// 		execute()
		// 	}
		// },
	}
}
