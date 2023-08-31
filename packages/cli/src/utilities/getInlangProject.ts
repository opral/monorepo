import fs from "node:fs/promises"
import { resolve } from "node:path"
import { openInlangProject, InlangProject, Result, tryCatch } from "@inlang/sdk"
import { telemetry } from "../services/telemetry/implementation.js"

// in case multiple commands run getInlang in the same process
let cached: Awaited<ReturnType<typeof getInlangProject>> | undefined = undefined

export async function getInlangProject(): Promise<Result<InlangProject, Error>> {
	if (cached) return cached

	const baseDirectory = process.cwd()
	const projectFilePath = resolve(baseDirectory, "project.inlang.json")

	const configExists = await fs
		.access(projectFilePath)
		.then(() => true)
		.catch(() => false)

	if (configExists === false) {
		return { error: new Error("No project.inlang.json file found in the repository.") }
	}

	cached = await tryCatch(() =>
		openInlangProject({
			projectFilePath,
			nodeishFs: fs,
			_capture(id, props) {
				telemetry.capture({
					// @ts-ignore the event types
					event: id,
					properties: props,
				})
			},
		}),
	)
	return cached
}
