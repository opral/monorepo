import { describe, it, expect } from "vitest"
import { makeFsAvailableTo } from "./index.js"
import { getFs } from "./index.js"
import { createNodeishMemoryFs } from "@lix-js/fs"

describe("rpc-fs", () => {
	it("can read and write a file over rpc - utf-8 encoding ", async () => {
		const fs = createNodeishMemoryFs()
		const { port1, port2 } = new MessageChannel()

		makeFsAvailableTo(fs, port1)
		const _fs = getFs(port2)

		_fs.writeFile("/test.txt", "hello")
		const content = await _fs.readFile("/test.txt", { encoding: "utf-8" })
		expect(content).toBe("hello")
	})

	it("can read and write a file over rpc - binary encoding", async () => {
		const fs = createNodeishMemoryFs()
		const { port1, port2 } = new MessageChannel()

		makeFsAvailableTo(fs, port1)
		const _fs = getFs(port2)

		_fs.writeFile("/test.txt", "hello")
		const content = await _fs.readFile("/test.txt")
		const decoder = new TextDecoder()
		const stringResult = decoder.decode(content)
		expect(stringResult).toBe("hello")
	})

	it("can read stats of an existing file", async () => {
		const fs = createNodeishMemoryFs()
		const { port1, port2 } = new MessageChannel()

		makeFsAvailableTo(fs, port1)
		const _fs = getFs(port2)

		_fs.writeFile("/test.txt", "hello")
		const stat = await _fs.stat("/test.txt")
		expect(stat.isFile()).toBe(true)
	})

	it("can watch over rpc", async () => {
		const fs = createNodeishMemoryFs()
		const { port1, port2 } = new MessageChannel()

		makeFsAvailableTo(fs, port1)
		const _fs = getFs(port2)

		async function startWatching(path: string, signal: AbortSignal) {
			const updates = []
			const watcher = _fs.watch(path, { signal })
			try {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				for await (const ev of watcher) {
					const newContent = await _fs.readFile("/test.txt", { encoding: "utf-8" })
					updates.push(newContent)
				}

				return updates
			} catch (err: unknown) {
				return updates
			}
		}

		const ac = new AbortController()

		const watcherPromise = startWatching("/test.txt", ac.signal)
		await sleep(50)

		await fs.writeFile("/test.txt", "update 1")
		await sleep(50)

		await fs.writeFile("/test.txt", "update 2")
		await sleep(50)

		ac.abort()
		await sleep(50)

		await fs.writeFile("/test.txt", "update after abort")
		await sleep(50)

		const updates = await watcherPromise
		expect(updates).toEqual(["update 1", "update 2"])
	})
})

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
