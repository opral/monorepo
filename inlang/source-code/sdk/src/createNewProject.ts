import type { Repository } from "@lix-js/client"
import { ProjectSettings } from "@inlang/project-settings"
import { assertValidProjectPath, pathExists } from "./validateProjectPath.js"
import { defaultProjectSettings } from "./defaultProjectSettings.js"

/**
 * Creates a new project in the given directory.
 * The directory must be an absolute path, must not exist, and must end with {name}.inlang
 * Uses defaultProjectSettings unless projectSettings are provided.
 *
 * @param projectPath - Absolute path to the [name].inlang directory
 * @param repo - An instance of a lix repo as returned by `openRepository`
 * @param projectSettings - Optional project settings to use for the new project.
 */
export async function createNewProject(args: {
	projectPath: string
	repo: Repository
	projectSettings: ProjectSettings
}): Promise<void> {
	assertValidProjectPath(args.projectPath)

	const nodeishFs = args.repo.nodeishFs
	if (await pathExists(args.projectPath, nodeishFs)) {
		throw new Error(`projectPath already exists, received "${args.projectPath}"`)
	}
	await nodeishFs.mkdir(args.projectPath, { recursive: true })

	const settingsText = JSON.stringify(args.projectSettings ?? defaultProjectSettings, undefined, 2)

	await nodeishFs.writeFile(`${args.projectPath}/settings.json`, settingsText)
}
