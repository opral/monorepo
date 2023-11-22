import { createUnplugin } from "unplugin"
import { loadProject } from "@inlang/sdk"
import { exec } from "node:child_process"
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

	return {
		name: "unplugin-paraglide",

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
})
