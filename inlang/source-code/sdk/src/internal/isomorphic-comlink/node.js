import { Worker as NodeWorker } from "node:worker_threads"
import nodeAdapter from "comlink/dist/esm/node-adapter.mjs"

export const WorkerPrototype = NodeWorker
export const adapter = nodeAdapter
