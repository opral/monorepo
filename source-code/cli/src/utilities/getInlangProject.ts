import fs from "node:fs/promises"
import { resolve } from "node:path"
import { createInlang, InlangProject, Result, tryCatch } from "@inlang/app"
import type { InlangModule } from "@inlang/module"
import pluginJson from "../../../plugins/json/dist/index.js"
import pluginLint from "../../../plugins/standard-lint-rules/dist/index.js"

// in case multiple commands run getInlang in the same process
let cached: Awaited<ReturnType<typeof getInlangProject>> | undefined = undefined

export async function getInlangProject(): Promise<Result<InlangProject, Error>> {
	if (cached) return cached

	const baseDirectory = process.cwd()
	const configPath = resolve(baseDirectory, "inlang.config.json")

	const configExists = await fs
		.access(configPath)
		.then(() => true)
		.catch(() => false)

	if (configExists === false) {
		return { error: new Error("No inlang.config.json file found in the repository.") }
	}

	cached = await tryCatch(() =>
		createInlang({
			configPath,
			nodeishFs: fs,
			_import: async () =>
				({
					default: {
						// @ts-ignore
						plugins: [...pluginJson.plugins],
						// @ts-ignore
						lintRules: [...pluginLint.lintRules],
					},
				} satisfies InlangModule),
		}),
	)

	return cached
}
