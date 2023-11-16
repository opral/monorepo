import type { PluginOption } from "vite"
import { exec } from "node:child_process"
import { loadProject } from "@inlang/sdk"
import path from "node:path"
import fs from "node:fs/promises"

export const vitePlugin = (config: {
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
			const inlang = await loadProject({
				settingsFilePath: path.resolve(process.cwd(), options.project),
				nodeishFs: fs,
			})

			inlang.query.messages.getAll.subscribe((messages) => {
				if (messages.length > 0) {
					execute()
				}
			})
		},
	}
}
