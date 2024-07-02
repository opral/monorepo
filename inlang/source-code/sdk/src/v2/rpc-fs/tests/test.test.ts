import { describe, it, expect } from "vitest"
import { createNodeishMemoryFs } from "@lix-js/fs"
import { makeFsAvailableTo } from "../host.js"
import { WorkerPrototype as Worker } from "comlink-node"

describe("rpc-fs", () => {
	it("worker can write files to FS", async () => {
		const fs = createNodeishMemoryFs()
		const worker = new Worker("./src/v2/rpc-fs/tests/write-worker.js")
		makeFsAvailableTo(fs, worker)

		await sleep(300)
		const content = await fs.readFile("/test.txt", { encoding: "utf-8" })
		expect(content).toBe("works!")
	})
})

async function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms))
}
