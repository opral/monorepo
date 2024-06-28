import { asyncIterableTransferHandler } from "./transfer-handlers.js"
import * as Comlink from "comlink"
import { adapter } from "comlink-node"
import type { NodeishFilesystemSubset } from "../types/plugin.js"

// @ts-ignore
Comlink.transferHandlers.set("asyncIterable", asyncIterableTransferHandler)

export function makeFsAvailableTo(fs: NodeishFilesystemSubset, wrkr: Worker) {
	const _fs: NodeishFilesystemSubset = {
		readdir: fs.readdir,
		readFile: fs.readFile,
		writeFile: fs.writeFile,
		mkdir: fs.mkdir,
		watch: (path, options) => fs.watch(path, options),
	}

	Comlink.expose(_fs, adapter(wrkr))
}
