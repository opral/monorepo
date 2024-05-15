import { createNodeishMemoryFs } from "@lix-js/fs"
import { describe, it, expect } from "vitest"
import { createNodeishFsWithWatcher } from "./createNodeishFsWithWatcher.js"

describe("watcher", () => {
	it("should trigger the update function when file changes", async () => {
		let counter = 0

		const fs = createNodeishFsWithWatcher({
			nodeishFs: createNodeishMemoryFs(),
			updateMessages: () => {
				counter++
			},
		})

		// establish watcher
		await fs.writeFile("file.txt", "a")
		await fs.readFile("file.txt", { encoding: "utf-8" })
		expect(counter).toBe(0)

		// initial file change
		await fs.writeFile("file.txt", "b")
		await new Promise((resolve) => setTimeout(resolve, 0))

		expect(counter).toBe(1)

		// change file
		await fs.writeFile("file.txt", "a")
		await new Promise((resolve) => setTimeout(resolve, 0))

		//check if update function was called
		expect(counter).toBe(2)

		// change file
		await fs.readFile("file.txt")
		await new Promise((resolve) => setTimeout(resolve, 0))

		//check if update function was called
		expect(counter).toBe(2)

		fs.stopWatching()

		// change file
		await fs.writeFile("file.txt", "b")
		await new Promise((resolve) => setTimeout(resolve, 0))

		//check if update function was called - should not since signalled
		expect(counter).toBe(2)
	})
})
