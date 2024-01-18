import fs from "node:fs/promises"
import { loadProject, type InlangProject } from "@inlang/sdk"
import { resolve } from "node:path"
import { openRepository, findRepoRoot } from "@lix-js/client"
import { id } from "../../marketplace-manifest.json"
import { telemetry } from "../services/telemetry/index.js"

/**
 * Gets the inlang project and exists if the project contains errors.
 */
export async function getInlangProject(args: { projectPath: string }): Promise<InlangProject> {
	const baseDirectory = process.cwd()
	const projectPath = resolve(baseDirectory, args.projectPath)

	const repoRoot = await findRepoRoot({ nodeishFs: fs, path: projectPath })

	let project
	if (!repoRoot) {
		console.error(
			`Could not find repository root for path ${projectPath}, falling back to direct fs access`
		)

		project = await loadProject({
			projectPath,
			nodeishFs: fs,
			appId: id,
		})
	} else {
		const repo = await openRepository(repoRoot, {
			nodeishFs: fs,
		})

		project = await loadProject({
			projectPath,
			repo,
			appId: id,
		})
	}

	if (project.errors().length > 0) {
		for (const error of project.errors()) {
			console.error(error)
		}
		process.exit(1)
	}
	if (project.id) {
		telemetry.groupIdentify({
			groupType: "project",
			groupKey: project.id,
		})
	}
	return project
}
