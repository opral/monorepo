import { parseOrigin, telemetryNode } from "@inlang/telemetry"
import fs from "node:fs"
import * as vscode from "vscode"
import type { TelemetryEvents } from "./events.js"
import { getUserId } from "../../utilities/settings/getUserId.js"
import { listRemotes, findRoot } from "isomorphic-git"

export const telemetry: Omit<typeof telemetryNode, "capture"> & { capture: typeof capture } =
	new Proxy(telemetryNode, {
		get(target, prop) {
			if (prop === "capture") {
				return capture
			}
			return (target as any)[prop]
		},
	}) as any

/**
 * Typesafe wrapper around the `telemetryNode.capture` method.
 *
 * Exists to avoid typos/always set the correct event name and properties.
 */
type CaptureEventArguments =
	| Omit<Parameters<typeof telemetryNode.capture>[0], "distinctId" | "groups"> & {
			event: TelemetryEvents
	  }

// let gitOrigin: string | undefined
let userID: string

/**
 * Capture a telemetry event in a typesafe way.
 */
async function capture(args: CaptureEventArguments) {
	// TODO add a project UUID to the tele.groups internal #196
	// if (gitOrigin === undefined) {
	// 	gitOrigin = await getGitOrigin()
	// }
	if (userID === undefined) {
		userID = await getUserId()
	}
	return telemetryNode.capture({
		...args,
		distinctId: userID,
		// TODO add a project UUID to the tele.groups internal #196

		// groups: gitOrigin
		// 	? {
		// 			repository: gitOrigin,
		// 	  }
		// 	: undefined,
	})
}

/**
 * Gets the git origin url of the currently opened repository.
 */

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
