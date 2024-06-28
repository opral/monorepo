import { asyncIterableTransferHandler } from "./transfer-handlers.js"
import * as Comlink from "comlink"
import type { NodeishFilesystemSubset } from "../types/plugin.js"
import { endpoint } from "comlink-node/worker"

// @ts-ignore
Comlink.transferHandlers.set("asyncIterable", asyncIterableTransferHandler)

export function getFs() {
	const fs = Comlink.wrap<NodeishFilesystemSubset>(endpoint)
	return fs
}
