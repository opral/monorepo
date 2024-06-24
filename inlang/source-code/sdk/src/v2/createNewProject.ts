import type { Repository } from "@lix-js/client"
import { ProjectSettings } from "@inlang/project-settings"
import { assertValidProjectPath, pathExists } from "../validateProjectPath.js"
import { defaultProjectSettings } from "./defaultProjectSettings.js"

/**
 * Creates a new project in the given directory.
 * The directory must be an absolute path, must not exist, and must end with {name}.inlang
 */
export async function createNewProject(args: {
	projectPath: string
	repo: Repository
	projectSettings?: ProjectSettings
}): Promise<void> {
	assertValidProjectPath(args.projectPath)

	const nodeishFs = args.repo.nodeishFs
	if (await pathExists(args.projectPath, nodeishFs)) {
		throw new Error(`projectPath already exists, received "${args.projectPath}"`)
	}
	const settingsText = JSON.stringify(args.projectSettings ?? defaultProjectSettings, undefined, 2)

	await nodeishFs.mkdir(args.projectPath, { recursive: true })
	await Promise.all([
		nodeishFs.writeFile(`${args.projectPath}/settings.json`, settingsText),
		nodeishFs.writeFile(`${args.projectPath}/.gitignore`, "cache"),
		nodeishFs.mkdir(`${args.projectPath}/cache/modules`, { recursive: true }),
	])
}
