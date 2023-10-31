import fs from "node:fs/promises"
import { loadProject, type InlangProject } from "@inlang/sdk"
import { telemetry } from "../services/telemetry/implementation.js"
import { resolve } from "node:path"

/**
 * Gets the inlang project and exists if the project contains errors.
 */
export async function getInlangProject(args: { projectPath: string }): Promise<InlangProject> {
	const baseDirectory = process.cwd()
	const settingsFilePath = resolve(baseDirectory, args.projectPath)

	const configExists = await fs
		.access(settingsFilePath)
		.then(() => true)
		.catch(() => false)

	if (configExists === false) {
		// should throw at this point bceause `loadProject` can't be executed
		throw new Error("No project.inlang.json file found in the repository.")
	}

	const project = await loadProject({
		settingsFilePath,
		nodeishFs: fs,
		_capture(id, props) {
			telemetry.capture({
				// @ts-ignore the event types
				event: id,
				properties: props,
			})
		},
	})

	if (project.errors().length > 0) {
		for (const error of project.errors()) {
			console.error(error)
		}
		process.exit(1)
	}
	return project
}
