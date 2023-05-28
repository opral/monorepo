import { raw } from "@inlang-git/client/raw"
import fs from "node:fs"
import * as vscode from "vscode"

/**
 * Gets the git origin url of the current repository.
 *
 * @returns The git origin url or undefined if it could not be found.
 */
export async function getGitRemotes() {
	try {
		const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
		if (workspaceRoot === undefined) {
			return undefined
		}
		const remotes = await raw.listRemotes({
			fs,
			dir: await raw.findRoot({
				fs,
				filepath: workspaceRoot,
			}),
		})
		return remotes
	} catch (e) {
		return undefined
	}
}
