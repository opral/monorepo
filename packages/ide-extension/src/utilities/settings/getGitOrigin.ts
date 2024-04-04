/**
 * Gets the git origin url of the currently opened repository. Wrapper around _getGitOrigin.ts to allow testing with functional code
 */

import { _getGitOrigin } from "./_getGitOrigin.js"

import * as vscode from "vscode"
import * as fs from "node:fs/promises"

export async function getGitOrigin() {
	const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? process.cwd()
	return _getGitOrigin({ fs, workspaceRoot })
}
