import { asyncIterableTransferHandler } from "./transfer/asyncIterable.js"
import * as Comlink from "comlink"
import { adapter } from "comlink-node"
import type { NodeishFilesystemSubset } from "../types/plugin.js"
import { watchOptionsTransferHandler } from "./transfer/watchOptions.js"

Comlink.transferHandlers.set("asyncIterable", asyncIterableTransferHandler)
Comlink.transferHandlers.set("watchOptions", watchOptionsTransferHandler)

export function makeFsAvailableTo(fs: NodeishFilesystemSubset, ep: Comlink.Endpoint) {
	console.log("makeFsAvailableTo", ep)
	Comlink.expose(fs, adapter(ep))
}
