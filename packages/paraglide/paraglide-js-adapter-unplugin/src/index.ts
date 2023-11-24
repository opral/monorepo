import { createUnplugin } from "unplugin"
import { loadProject } from "@inlang/sdk"
import { execSync, exec } from "node:child_process"
import path from "node:path"
import fs from "node:fs/promises"

export type UserConfig = {
	project: string
	outdir: string
}

export const paraglide = createUnplugin((config: UserConfig) => {
	const options = {
		silent: false,
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

	const executeSync = () => {
		execSync(`paraglide-js compile --project ${options.project} --outdir ${options.outdir}`)
	}

	return {
		name: "unplugin-paraglide",

		enforce: "pre",
		async buildStart() {
			executeSync()
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
})
