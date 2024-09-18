import fs from "node:fs/promises"
import { loadProjectFromDirectoryInMemory, type InlangProject } from "@inlang/sdk2"
import { resolve } from "node:path"
import { id } from "../../marketplace-manifest.json"

/**
 * Used for telemetry.
 */
export let lastUsedProject: InlangProject | undefined

/**
 * Gets the inlang project and exits if the project contains errors.
 */
export async function getInlangProject(args: { projectPath: string }): Promise<InlangProject> {
	try {
		const baseDirectory = process.cwd()
		const projectPath = resolve(baseDirectory, args.projectPath)

		const project = await loadProjectFromDirectoryInMemory({
			path: projectPath,
			fs: fs,
			appId: id,
		})

		const errors = await project.errors.get()
		if (errors.length > 0) {
			for (const error of errors) {
				console.error(error)
			}
			process.exit(1)
		}

		lastUsedProject = project
		return project
	} catch (err) {
		console.error(`Error opening inlang project at ${args.projectPath}`, err)
		process.exit(1)
	}
}
