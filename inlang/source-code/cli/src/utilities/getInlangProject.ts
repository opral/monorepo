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

	const project = await loadProject({
		projectPath: settingsFilePath,
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
