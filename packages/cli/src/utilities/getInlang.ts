import { initialize$import, InlangEnvironment } from "@inlang/core/environment"
import * as fs from "node:fs/promises"
import type { Result } from "@inlang/core/utilities"
import type { OptionValues } from "commander"
import { resolve } from "node:path"
import { createInlang, InlangInstance } from "@inlang/app"

// in case multiple commands run getInlang in the same process
let inlangInstance: InlangInstance | undefined = undefined

export async function getInlang(args: {
	options: OptionValues
}): Promise<Result<InlangInstance, "No inlang.config.js file found in the repository.">> {
	if (inlangInstance) return [inlangInstance]

	// Set up the environment functions
	const env: InlangEnvironment = {
		$fs: fs,
		$import: initialize$import({
			fs: fs,
			fetch,
		}),
	}

	const baseDirectory = process.cwd()
	const filePath = args.options.config
		? resolve(baseDirectory, args.options.config)
		: resolve(baseDirectory, "inlang.config.js")

	if (!env.$fs.readFile(filePath)) {
		return [undefined, "No inlang.config.js file found in the repository."]
	}

	const inlang = createInlang({
		configPath: filePath,
		nodeishFs: fs,
		_import: env.$import,
	})

	inlangInstance = await inlang
	return [inlangInstance]
}

