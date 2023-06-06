import { parseOrigin, telemetryNode } from "@inlang/telemetry"
import { raw } from "@inlang-git/client/raw"
import fs from "node:fs"
import * as vscode from "vscode"
import type { TelemetryEvents } from "./events.js"
import { getUserId } from "../../utils/getUserId.js"

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

let gitOrigin: string
let userID: string

/**
 * Capture a telemetry event in a typesafe way.
 */
async function capture(args: CaptureEventArguments) {
	if (gitOrigin === undefined) {
		gitOrigin = await getGitOrigin()
	}
	if (userID === undefined) {
		userID = await getUserId()
	}
	return telemetryNode.capture({
		...args,
		distinctId: userID,
		groups: {
			repository: gitOrigin,
		},
	})
}

/**
 * Gets the git origin url of the currently opened repository.
 */
export async function getGitOrigin() {
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
