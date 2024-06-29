import { asyncIterableTransferHandler } from "./transfer-handlers.js"
import * as Comlink from "comlink"
import type { NodeishFilesystemSubset } from "../types/plugin.js"
import { endpoint } from "comlink-node/worker"
import { abortSignalTransferHandler } from "./abortSignalTransfer.js"

// @ts-ignore
Comlink.transferHandlers.set("asyncIterable", asyncIterableTransferHandler)
Comlink.transferHandlers.set("ABORT_SIGNAL", abortSignalTransferHandler)

export function getFs(): any {
	const _fs = Comlink.wrap<NodeishFilesystemSubset>(endpoint)

	return {
		readdir: _fs.readdir,
		readFile: _fs.readFile,
		writeFile: _fs.writeFile,
		mkdir: _fs.mkdir,
		// @ts-ignore
		watch: (path, options) => {
			if (options.signal) {
				console.log("signal", options.signal)
				return _fs.watch(path, {
					...options,
					signal: Comlink.transfer(options.signal, [options.signal]),
				})
			} else return _fs.watch(path, options)
		},
	}
}
