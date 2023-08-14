import fs from "node:fs/promises"
import type { OptionValues } from "commander"
import { resolve } from "node:path"
import { createInlang, InlangInstance, Result } from "@inlang/app"

// in case multiple commands run getInlang in the same process
let cachedInlangInstance: InlangInstance | undefined = undefined

export async function getInlang(args: {
	options: OptionValues
}): Promise<Result<InlangInstance, "No inlang.config.json file found in the repository.">> {
	if (cachedInlangInstance) return { data: cachedInlangInstance }

	const baseDirectory = process.cwd()
	const filePath = args.options.config
		? resolve(baseDirectory, args.options.config)
		: resolve(baseDirectory, "inlang.config.json")

	if (await fs.readFile(filePath)) {
		return { error: "No inlang.config.json file found in the repository." }
	}
	cachedInlangInstance = await createInlang({ configPath: filePath, nodeishFs: fs })
	return { data: cachedInlangInstance }
}
