import { describe, it, expect } from "vitest"
import { pathExists } from "./exists.js"
import memfs from "memfs"

describe("fileExists", () => {
	it("returns true if the file does exist", async () => {
		const fs = memfs.Volume.fromNestedJSON({
			"/test.txt": "hello",
		}).promises as unknown as typeof import("node:fs/promises")

		const result = await pathExists("/test.txt", fs)
		expect(result).toBe(true)
	})

	it("returns false if the file does not exist", async () => {
		const fs = memfs.Volume.fromNestedJSON({
			"/test.txt": "hello",
		}).promises as unknown as typeof import("node:fs/promises")

		const result = await pathExists("/does-not-exist.txt", fs)
		expect(result).toBe(false)
	})

	it("returns true if the path is a directory", async () => {
		const fs = memfs.Volume.fromNestedJSON({
			"/test/test.txt": "Hello",
		}).promises as unknown as typeof import("node:fs/promises")

		const result = await pathExists("/test", fs)
		expect(result).toBe(true)
	})
})
