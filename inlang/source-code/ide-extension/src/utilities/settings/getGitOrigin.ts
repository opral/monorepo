/**
 * Gets the git origin url of the currently opened repository.
 */

import { findRepoRoot, openRepository } from "@lix-js/client"
import * as vscode from "vscode"
import * as fs from "node:fs/promises"

export async function getGitOrigin() {
	try {
		const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath

		const repoRoot = await findRepoRoot({
			nodeishFs: fs,
			path: workspaceRoot ?? process.cwd(),
		})

		if (!repoRoot) {
			console.error("Failed to find repository root.")
			return
		}
		const repo = await openRepository(repoRoot, { nodeishFs: fs })
		return repo.getOrigin()
	} catch (e) {
		return undefined
	}
}
