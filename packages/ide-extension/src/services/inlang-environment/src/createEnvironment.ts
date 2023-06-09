import type { InlangEnvironment } from "@inlang/core/environment"
import { create$import } from "./create$import.js"
import { createFileSystemMapper } from "./createFileSystemMapper.js"
import * as vscode from "vscode"

/**
 * Creates a new inlang environment.
 */
export function createInlangEnv(args: {
	workspaceFolder: vscode.WorkspaceFolder
}): InlangEnvironment {
	return {
		$import: create$import(args.workspaceFolder.uri.path),
		$fs: createFileSystemMapper(vscode.workspace.fs, args.workspaceFolder.uri),
	}
}
