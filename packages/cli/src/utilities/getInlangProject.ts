import fs from "node:fs/promises"
import { loadProject, type InlangProject } from "@inlang/sdk"
import { resolve } from "node:path"
import { openRepository, findRepoRoot } from "@lix-js/client"
import { id } from "../../marketplace-manifest.json"

/**
 * Used for telemetry.
 */
export let lastUsedProject: InlangProject | undefined

/**
 * Gets the inlang project and exits if the project contains errors.
 */
export async function getInlangProject(args: { projectPath: string }): Promise<InlangProject> {
	const baseDirectory = process.cwd()
	const projectPath = resolve(baseDirectory, args.projectPath)

	let repoRoot = await findRepoRoot({ nodeishFs: fs, path: projectPath })

	if (!repoRoot) {
		console.error(
			`Could not find repository root for path ${projectPath}, falling back to direct fs access`
		)
		repoRoot = baseDirectory
	}
	const repo = await openRepository(repoRoot, {
		nodeishFs: fs,
	})

	const project = await loadProject({
		projectPath,
		repo,
		appId: id,
	})

	if (project.errors().length > 0) {
		for (const error of project.errors()) {
			console.error(error)
		}
		process.exit(1)
	}
	lastUsedProject = project
	return project
}
