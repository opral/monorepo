import type { InlangEnvironment } from "@inlang/core/environment"
import { $import } from "./$import.js"
import { createFileSystemMapper } from "./createFileSystemMapper.js"
import * as vscode from "vscode"

/**
 * Creates a new inlang environment.
 */
export function createInlangEnv(args: {
	workspaceFolder: vscode.WorkspaceFolder
}): InlangEnvironment {
	return {
		$import,
		$fs: createFileSystemMapper(vscode.workspace.fs, args.workspaceFolder.uri),
	}
}
