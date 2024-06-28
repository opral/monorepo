import { WorkerPrototype as Worker } from "comlink-node"
import { makeFsAvailableTo } from "./host.js"
import type { NodeishFilesystem } from "@lix-js/fs"

export function createTestWorker(fs: NodeishFilesystem) {
	const worker = new Worker(new URL("./test-worker.js", import.meta.url), { type: "module" })
	makeFsAvailableTo(fs, worker)
}
