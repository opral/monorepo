import { WorkerPrototype as Worker } from "comlink-node"
import { makeFsAvailableTo } from "../index.js"
import type { NodeishFilesystem } from "@lix-js/fs"

export function createTestWorker(fs: NodeishFilesystem) {
	const worker1 = new Worker(new URL("./worker-1.js", import.meta.url), { type: "module" })
	// const worker2 = new Worker(new URL("./worker-2.js", import.meta.url), { type: "module" })

	makeFsAvailableTo(fs, worker1)
	// makeFsAvailableTo(fs, worker2)
}
