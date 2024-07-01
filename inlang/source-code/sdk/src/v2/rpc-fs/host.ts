import { asyncIterableTransferHandler } from "./transfer/asyncIterable.js"
import * as Comlink from "comlink"
import { adapter } from "comlink-node"
import type { NodeishFilesystemSubset } from "../types/plugin.js"
import { watchOptionsTransferHandler } from "./transfer/watchOptions.js"

Comlink.transferHandlers.set("asyncIterable", asyncIterableTransferHandler)
Comlink.transferHandlers.set("watchOptions", watchOptionsTransferHandler)

export function makeFsAvailableTo(fs: NodeishFilesystemSubset, wrkr: Worker) {
	const _fs: NodeishFilesystemSubset = {
		readdir: fs.readdir,
		readFile: fs.readFile,
		writeFile: fs.writeFile,
		mkdir: fs.mkdir,
		watch: fs.watch,
	}

	Comlink.expose(_fs, adapter(wrkr))
}
