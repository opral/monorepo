import { describe, expect, test } from "vitest"
import { createNodeishMemoryFs } from "@lix-js/fs"
import { makeFsAvailableTo } from "../host.js"
import ReadWriteWorker from "./workers/read-write.js?worker"

import WriteWorker from "./workers/write.js?worker"

describe("rpc-fs", () => {
	test.only("worker can read and write files to FS", async () => {
		const fs = createNodeishMemoryFs()

		const content = String(Math.random())
		await fs.writeFile("/in.txt", content)

		const worker = new ReadWriteWorker()
		makeFsAvailableTo(fs, worker)

		await sleep(1000)
		const out = await fs.readFile("/out.txt", { encoding: "utf-8" })
		expect(out).toBe(content)
	})
	test("worker can write files to FS", async () => {
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
