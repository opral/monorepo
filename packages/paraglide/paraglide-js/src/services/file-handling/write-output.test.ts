import memfs from "memfs"
import nodeFsPromises from "node:fs/promises"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { createNodeishMemoryFs } from "@inlang/sdk/test-utilities"
import type { NodeishFilesystem } from "./types.js"

beforeEach(() => {
	vi.resetModules()
})

describe("write output", () => {
	it("should write the output to a non-existing directory", async () => {
		const { writeOutput } = await import("./write-output.js")
		const fs = mockFs({})

		await writeOutput("/output", { "test.txt": "test" }, fs)
		expect(await fs.readFile("/output/test.txt", { encoding: "utf-8" })).toBe("test")
	})

	it("should clear & overwrite output that's already there", async () => {
		const { writeOutput } = await import("./write-output.js")
		const fs = mockFs({
			"/output/test.txt": "old",
			"/output/other.txt": "other",
		})

		await writeOutput("/output", { "test.txt": "new" }, fs)

		expect(await fs.readFile("/output/test.txt", { encoding: "utf-8" })).toBe("new")
		await expect(
			async () => await fs.readFile("/output/other.txt", { encoding: "utf-8" })
		).rejects.toBeDefined()
	})

	it("should create any missing directories", async () => {
		const { writeOutput } = await import("./write-output.js")
		const fs = mockFs({})

		await writeOutput(
			"/output/messages",
			{
				"de/test.txt": "de",
				"en/test.txt": "en",
			},
			fs
		)
		expect(await fs.readFile("/output/messages/de/test.txt", { encoding: "utf-8" })).toBe("de")
		expect(await fs.readFile("/output/messages/en/test.txt", { encoding: "utf-8" })).toBe("en")
	})

	it("should only write once if the output hasn't changed", async () => {
		const { writeOutput } = await import("./write-output.js")
		const fs = mockFs({})

		// @ts-ignore
		fs.writeFile = vi.spyOn(fs, "writeFile")

		await writeOutput("/output", { "test.txt": "test" }, fs)
		await writeOutput("/output", { "test.txt": "test" }, fs)
		expect(await fs.readFile("/output/test.txt", { encoding: "utf-8" })).toBe("test")
		expect(fs.writeFile).toHaveBeenCalledTimes(1)
	})

	it("should write again if the output has changed", async () => {
		const { writeOutput } = await import("./write-output.js")
		const fs = mockFs({})

		// @ts-ignore
		fs.writeFile = vi.spyOn(fs, "writeFile")

		await writeOutput("/output", { "test.txt": "test" }, fs)
		await writeOutput("/output", { "test.txt": "test2" }, fs)
		expect(await fs.readFile("/output/test.txt", { encoding: "utf-8" })).toBe("test2")
		expect(fs.writeFile).toHaveBeenCalledTimes(2)
	})
})

const mockFs = (files: memfs.DirectoryJSON) => {
	const _memfs = memfs.createFsFromVolume(memfs.Volume.fromJSON(files))
	const lixFs = createNodeishMemoryFs()
	for (const prop in nodeFsPromises) {
		// @ts-ignore - memfs has the same interface as node:fs/promises
		if (typeof nodeFsPromises[prop] !== "function") continue
		// @ts-ignore - memfs dies not have a watch interface - quick fix should be updated
		if (nodeFsPromises[prop].name === "watch") {
			// @ts-ignore - memfs has the same interface as node:fs/promises
			vi.spyOn(_memfs.promises, prop).mockImplementation(lixFs[prop])
		} else {
			if (prop in _memfs.promises) {
				// @ts-ignore - memfs has the same interface as node:fs/promises
				vi.spyOn(_memfs.promises, prop)
			}
		}
	}
	return _memfs.promises as NodeishFilesystem
}
