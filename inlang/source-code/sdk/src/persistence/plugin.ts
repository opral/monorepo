import type { ProjectSettings } from "@inlang/sdk"
import type { MessageBundle } from "../v2/types.js"
import { normalizeMessageBundle } from "../v2/createMessageBundle.js"
import { getDirname, type NodeishFilesystem } from "@lix-js/fs"

import _debug from "debug"
const debug = _debug("sdk:persistence")

export const pluginId = "plugin.sdk.persistence"

export async function loadMessages(args: {
	settings: ProjectSettings
	nodeishFs: NodeishFilesystem
}) {
	let result: MessageBundle[] = []
	const pathPattern = args.settings[pluginId]?.pathPattern as string

	debug("loadMessages", pathPattern)
	try {
		const file = await args.nodeishFs.readFile(pathPattern, { encoding: "utf-8" })
		result = JSON.parse(file)
	} catch (error) {
		if ((error as any)?.code !== "ENOENT") {
			debug("loadMessages", error)
			throw error
		}
	}
	return result
}

export async function saveMessages(args: {
	settings: ProjectSettings
	nodeishFs: NodeishFilesystem
	messages: MessageBundle[]
}) {
	const pathPattern = args.settings[pluginId]?.pathPattern as string

	debug("saveMessages", pathPattern)
	try {
		await createDirectoryIfNotExits(getDirname(pathPattern), args.nodeishFs)
		await args.nodeishFs.writeFile(
			pathPattern,
			// 2 spaces indentation
			JSON.stringify(args.messages.map(normalizeMessageBundle), undefined, 2)
		)
	} catch (error) {
		debug("saveMessages", error)
	}
}

async function createDirectoryIfNotExits(path: string, nodeishFs: NodeishFilesystem) {
	try {
		await nodeishFs.mkdir(path, { recursive: true })
	} catch {
		// assume that the directory already exists
	}
}
