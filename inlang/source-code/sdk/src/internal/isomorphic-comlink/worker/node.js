import nodeAdapter from "comlink/dist/esm/node-adapter.mjs"
import { parentPort } from "node:worker_threads"

export const endpoint = nodeAdapter(parentPort)
