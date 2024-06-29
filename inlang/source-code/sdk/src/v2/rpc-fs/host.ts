import { asyncIterableTransferHandler } from "./transfer-handlers.js"
import * as Comlink from "comlink"
import { adapter } from "comlink-node"
import type { NodeishFilesystemSubset } from "../types/plugin.js"
import { abortSignalTransferHandler } from "./abortSignalTransfer.js"

// @ts-ignore
Comlink.transferHandlers.set("asyncIterable", asyncIterableTransferHandler)
Comlink.transferHandlers.set("ABORT_SIGNAL", abortSignalTransferHandler)

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
