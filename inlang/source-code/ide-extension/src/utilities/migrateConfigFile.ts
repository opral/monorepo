import path from "node:path"
import * as vscode from "vscode"
import { createFileSystemMapper } from "./createFileSystemMapper.js"
import { migrateProjectSettings } from "@inlang/create-project"
import { msg } from "./message.js"

/**
 * Migrates the project config from inlang.config.js to project.inlang.json
 * @param workspaceFolder
 * @param closestProjectFilePathUri
 */
export const migrateConfigFile = async (
	workspaceFolder: vscode.WorkspaceFolder,
	closestProjectFilePathUri: vscode.Uri,
) => {
	// try to migrate project config
	const { warnings } = await migrateProjectSettings({
		filePath: closestProjectFilePathUri.fsPath,
		nodeishFs: createFileSystemMapper(workspaceFolder.uri.fsPath),
		pathJoin: path.join,
	})
	if (warnings.length > 0) {
		for (const warning of warnings) {
			console.warn(warning)
		}
	}

	// if no warnings, display success message
	if (warnings.length === 0) {
		msg("Successfully migrated project config from inlang.config.js to project.inlang.json")
	}
}
