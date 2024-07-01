import { asyncIterableTransferHandler } from "./transfer-handlers.js"
import * as Comlink from "comlink"
import type { NodeishFilesystemSubset } from "../types/plugin.js"
import { endpoint } from "comlink-node/worker"
import { watchOptionsTransferHandler } from "./watchOptionsTransferHandler.js"

Comlink.transferHandlers.set("asyncIterable", asyncIterableTransferHandler)
Comlink.transferHandlers.set("watchOptions", watchOptionsTransferHandler)

export function getFs(): any {
	const _fs = Comlink.wrap<NodeishFilesystemSubset>(endpoint)

	return {
		readdir: _fs.readdir,
		readFile: _fs.readFile,
		writeFile: _fs.writeFile,
		mkdir: _fs.mkdir,
		watch: _fs.watch,
	}
}
