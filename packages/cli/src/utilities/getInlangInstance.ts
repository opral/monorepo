import fs from "node:fs/promises"
import { resolve } from "node:path"
import { createInlang, InlangInstance, Result, tryCatch } from "@inlang/app"

// in case multiple commands run getInlang in the same process
let cached: Awaited<ReturnType<typeof getInlangInstance>> | undefined = undefined

export async function getInlangInstance(): Promise<Result<InlangInstance, Error>> {
	if (cached) return cached

	const baseDirectory = process.cwd()
	const configPath = resolve(baseDirectory, "inlang.config.json")

	if (await fs.readFile(configPath)) {
		return { error: new Error("No inlang.config.json file found in the repository.") }
	}
	cached = await tryCatch(() => createInlang({ configPath, nodeishFs: fs }))
	return cached
}
