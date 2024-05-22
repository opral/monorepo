import type { MessageBundle } from "../v2/types.js"
import { normalizeMessageBundle } from "../v2/createMessageBundle.js"
import { getDirname, type NodeishFilesystem } from "@lix-js/fs"
import type { StoreApi } from "./storeApi.js"

import _debug from "debug"
const debug = _debug("sdk:store")

export async function openStore(args: {
	projectPath: string
	nodeishFs: NodeishFilesystem
}): Promise<StoreApi> {
	const filePath = args.projectPath + "/messages.json"

	const index: Map<string, MessageBundle> = new Map()

	const messages = await loadAll({ filePath, nodeishFs: args.nodeishFs })
	for (const message of messages) {
		index.set(message.id, message)
	}

	return {
		messageBundles: {
			get: async (args: { id: string }) => {
				return index.get(args.id)
			},
			getAll: async () => {
				return [...index.values()]
			},
		},
	}
}

export async function loadAll(args: { filePath: string; nodeishFs: NodeishFilesystem }) {
	let result: MessageBundle[] = []

	debug("loadAll", args.filePath)
	try {
		const file = await args.nodeishFs.readFile(args.filePath, { encoding: "utf-8" })
		result = JSON.parse(file)
	} catch (error) {
		if ((error as any)?.code !== "ENOENT") {
			debug("loadMessages", error)
			throw error
		}
	}
	return result
}

export async function saveAll(args: {
	filePath: string
	nodeishFs: NodeishFilesystem
	messages: MessageBundle[]
}) {
	debug("saveall", args.filePath)
	try {
		await createDirectoryIfNotExits(getDirname(args.filePath), args.nodeishFs)
		await args.nodeishFs.writeFile(
			args.filePath,
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
