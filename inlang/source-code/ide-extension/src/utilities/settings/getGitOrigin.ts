/**
 * Gets the git origin url of the currently opened repository.
 */

import { parseOrigin } from "@inlang/telemetry"
import { findRoot, listRemotes } from "isomorphic-git"
import * as vscode from "vscode"
import * as fs from "node:fs"

export async function getGitOrigin() {
	try {
		const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
		const remotes = await listRemotes({
			fs,
			dir: await findRoot({
				fs,
				filepath: workspaceRoot ?? process.cwd(),
			}),
		})
		const gitOrigin = parseOrigin({ remotes })
		return gitOrigin
	} catch (e) {
		return undefined
	}
}
