import { parseOrigin } from "@inlang/telemetry"
import { raw } from "@inlang-git/client/raw"
import fs from "node:fs"
import * as vscode from "vscode"

let gitOrigin: string

/**
 * The groups that are used to categorize telemetry events.
 *
 * Exists to avoid typos/always set the correct groups.
 *
 * @example
 *   import { getTelemetryGroups } from "telemetry"
 *
 *   telemetry.capture("event-name", {
 * 	   groups: getTelemetryGroups(),
 *   })
 */
export async function getTelemetryGroups() {
	if (gitOrigin === undefined) {
		gitOrigin = await getGitOrigin()
	}
	return {
		repository: gitOrigin,
	}
}

/**
 * Gets the git origin url of the currently opened repository.
 */
async function getGitOrigin() {
	const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
	const remotes = await raw.listRemotes({
		fs,
		dir: await raw.findRoot({
			fs,
			filepath: workspaceRoot ?? process.cwd(),
		}),
	})
	const gitOrigin = parseOrigin({ remotes })
	return gitOrigin
}
