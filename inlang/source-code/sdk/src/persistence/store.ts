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
	const nodeishFs = args.nodeishFs
	const index = await load()

	return {
		messageBundles: {
			get: async (args: { id: string }) => {
				return index.get(args.id)
			},
			set: async (args: { data: MessageBundle }) => {
				index.set(args.data.id, args.data)
				await save()
			},
			delete: async (args: { id: string }) => {
				index.delete(args.id)
				await save()
			},
			getAll: async () => {
				return [...index.values()]
			},
		},
	}

	async function load() {
		const messages = await readJSON({ filePath, nodeishFs: nodeishFs })
		return new Map<string, MessageBundle>(messages.map((message) => [message.id, message]))
	}
	async function save() {
		await writeJSON({ filePath, nodeishFs: nodeishFs, messages: [...index.values()] })
	}
}

export async function readJSON(args: { filePath: string; nodeishFs: NodeishFilesystem }) {
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

export async function writeJSON(args: {
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
