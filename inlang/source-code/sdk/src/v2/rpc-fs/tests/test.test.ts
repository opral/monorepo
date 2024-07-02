import { describe, it, expect } from "vitest"
import { createNodeishMemoryFs } from "@lix-js/fs"
import { makeFsAvailableTo } from "../host.js"
import WriteWorker from "./write-worker.js?worker"

describe("rpc-fs", () => {
	it("worker can write files to FS", async () => {
		const fs = createNodeishMemoryFs()
		const worker = new WriteWorker()
		makeFsAvailableTo(fs, worker)

		await sleep(200)
		const content = await fs.readFile("/test.txt", { encoding: "utf-8" })
		expect(content).toBe("works!")
	})
})

async function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms))
}
