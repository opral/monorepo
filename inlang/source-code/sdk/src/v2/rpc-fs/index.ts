import { asyncIterableTransferHandler } from "./transfer/asyncIterable.js"
import * as Comlink from "comlink"
import type { NodeishFilesystemSubset } from "../types/plugin.js"
import { watchOptionsTransferHandler } from "./transfer/watchOptions.js"
import { adapter } from "comlink-node"

Comlink.transferHandlers.set("asyncIterable", asyncIterableTransferHandler)
Comlink.transferHandlers.set("watchOptions", watchOptionsTransferHandler)

export function makeFsAvailableTo(fs: NodeishFilesystemSubset, ep: Comlink.Endpoint) {
	Comlink.expose(fs, adapter(ep))
}

type FileChangeInfo = { eventType: "rename" | "change"; filename: string | null }

export function getFs(ep: Comlink.Endpoint): NodeishFilesystemSubset {
	const _fs = Comlink.wrap<NodeishFilesystemSubset>(ep)

	return {
		readdir: _fs.readdir,
		readFile: _fs.readFile as any,
		writeFile: _fs.writeFile,
		mkdir: _fs.mkdir,
		watch: async function* (path, options): AsyncIterable<FileChangeInfo> {
			const signal = options?.signal
			if (signal) delete options.signal

			const remoteAC = signal ? new AbortController() : undefined

			if (signal) {
				signal.onabort = () => {
					remoteAC?.abort(signal.reason)
				}
			}

			yield* await _fs.watch(path, {
				...options,
				signal: remoteAC?.signal,
			})
		},
	}
}
