import { newProject } from "./newProject.js"
import { loadProjectInMemory } from "./loadProjectInMemory.js"
// eslint-disable-next-line no-restricted-imports
import type fs from "node:fs/promises"
import type { loadProject } from "./loadProject.js"

/**
 * Loads a project from a directory.
 *
 * Main use case are dev tools that want to load a project from a directory
 * that is stored in git.
 */
export async function loadProjectFromDirectory(
	args: { path: string; fs: typeof fs } & Pick<Parameters<typeof loadProject>[0], "_mockPlugins">
) {
	args
	const project = await loadProjectInMemory({
		// pass common arguments to loadProjectInMemory
		...args,
		blob: await newProject(),
	})
	return project
}
