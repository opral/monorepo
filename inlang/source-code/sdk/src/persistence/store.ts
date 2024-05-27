import type { MessageBundle } from "../v2/types.js"
import { normalizeMessageBundle } from "../v2/createMessageBundle.js"
import { getDirname, type NodeishFilesystem } from "@lix-js/fs"
import { acquireFileLock } from "./filelock/acquireFileLock.js"
import { releaseLock } from "./filelock/releaseLock.js"
import { throttle } from "throttle-debounce"
import type { StoreApi } from "./storeApi.js"

import _debug from "debug"
const debug = _debug("sdk:store")

export async function openStore(args: {
	projectPath: string
	nodeishFs: NodeishFilesystem
}): Promise<StoreApi> {
	const nodeishFs = args.nodeishFs
	const filePath = args.projectPath + "/messages.json"
	const lockDirPath = args.projectPath + "/messagelock"

	// save to disk at most once per second
	const throttledSave = throttle(1000, save)

	// the index holds the in-memory state
	// TODO: reload when file changes on disk
	const index = await load()

	return {
		messageBundles: {
			get: async (args: { id: string }) => {
				return index.get(args.id)
			},
			set: async (args: { data: MessageBundle }) => {
				index.set(args.data.id, args.data)
				await throttledSave()
			},
			delete: async (args: { id: string }) => {
				index.delete(args.id)
				await throttledSave()
			},
			getAll: async () => {
				return [...index.values()]
			},
		},
	}

	// load and save messages from file system atomically
	// using a lock file to prevent partial reads and writes
	async function load() {
		const lockTime = await acquireFileLock(nodeishFs, lockDirPath, "load")
		const messages = await readJSON({ filePath, nodeishFs: nodeishFs })
		const index = new Map<string, MessageBundle>(messages.map((message) => [message.id, message]))
		await releaseLock(nodeishFs, lockDirPath, "load", lockTime)
		return index
	}
	async function save() {
		const lockTime = await acquireFileLock(nodeishFs, lockDirPath, "save")
		await writeJSON({ filePath, nodeishFs: nodeishFs, messages: [...index.values()] })
		await releaseLock(nodeishFs, lockDirPath, "load", lockTime)
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
		throw error
	}
}

async function createDirectoryIfNotExits(path: string, nodeishFs: NodeishFilesystem) {
	try {
		await nodeishFs.mkdir(path, { recursive: true })
	} catch (error: any) {
		if (error.code !== "EEXIST") {
			throw error
		}
	}
}
