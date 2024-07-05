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

export function getFs(ep: Comlink.Endpoint): NodeishFilesystemSubset {
	const _fs = Comlink.wrap<NodeishFilesystemSubset>(ep)

	return {
		readdir: _fs.readdir,
		readFile: _fs.readFile as any,
		writeFile: _fs.writeFile,
		mkdir: _fs.mkdir,
		watch: (path, options) => {
			const signal = options?.signal
			if (signal) delete options.signal

			type FileChangeInfo = { eventType: "rename" | "change"; filename: string | null }

			const remoteAC = signal ? new AbortController() : undefined
			const stream = new ReadableStream<FileChangeInfo>({
				async start(controller) {
					const watcher = await _fs.watch(path, {
						...options,
						signal: remoteAC?.signal,
					})

					for await (const ev of watcher) {
						controller.enqueue(ev)
					}
				},
				cancel() {},
				pull() {},
			})

			if (signal) {
				signal.onabort = () => {
					remoteAC?.abort(signal.reason)
					throw "asd"
				}
			}

			return toAsyncIterable(stream)
		},
	}
}

async function* toAsyncIterable<T>(stream: ReadableStream<T>): AsyncIterable<T> {
	const reader = stream.getReader()

	while (true) {
		const { done, value } = await reader.read()
		if (done) break
		yield value
	}
}
