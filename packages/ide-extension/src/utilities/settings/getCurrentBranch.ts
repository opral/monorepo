/**
 * Get the current branch of the git repository. Wrapper around _getGitBranch.ts to allow testing with functional code
 */

import { _getCurrentBranch } from "./_getCurrentBranch.js"

import * as vscode from "vscode"
import * as fs from "node:fs/promises"

export async function getCurrentBranch() {
	const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? process.cwd()
	return _getCurrentBranch({ fs, workspaceRoot })
}
