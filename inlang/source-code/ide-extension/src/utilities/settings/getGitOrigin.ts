/**
 * Gets the git origin url of the currently opened repository.
 */

import { parseOrigin } from "@inlang/telemetry"
import { findRepoRoot, _listRemotes } from "@lix-js/client"
import * as vscode from "vscode"
import * as fs from "node:fs/promises"

export async function getGitOrigin() {
	try {
		const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath

		// FIXME _listRemotes is deprecated. openRepo and then call repo.listRemotes instead!
		const remotes = await _listRemotes({
			fs,
			dir: (
				await findRepoRoot({
					nodeishFs: fs,
					path: workspaceRoot ?? process.cwd(),
				})
			)?.replace("file://", ""),
		})
		const gitOrigin = parseOrigin({ remotes })
		return gitOrigin
	} catch (e) {
		return undefined
	}
}
