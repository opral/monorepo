import memfs from "memfs"
import nodeFsPromises from "node:fs/promises"
import { describe, it, expect, vi } from "vitest"
import { createNodeishMemoryFs } from "@inlang/sdk/test-utilities"
import { writeOutput } from "./write-output.js"

describe("write output", () => {
	it("should write the output to a non-existing directory", async () => {
		const fs = mockFs({})

		await writeOutput("/output", { "test.txt": "test" }, fs)
		expect(await fs.readFile("/output/test.txt", "utf-8")).toBe("test")
	})

	it("should clear & overwrite output that's already there", async () => {
		const fs = mockFs({
			"/output/test.txt": "old",
			"/output/other.txt": "other",
		})

		await writeOutput("/output", { "test.txt": "new" }, fs)

		expect(await fs.readFile("/output/test.txt", "utf-8")).toBe("new")
		await expect(async () => await fs.readFile("/output/other.txt", "utf-8")).rejects.toBeDefined()
	})

	it("should create any missing directories", async () => {
		const fs = mockFs({})

		await writeOutput(
			"/output/messages",
			{
				"de/test.txt": "de",
				"en/test.txt": "en",
			},
			fs
		)
		expect(await fs.readFile("/output/messages/de/test.txt", "utf-8")).toBe("de")
		expect(await fs.readFile("/output/messages/en/test.txt", "utf-8")).toBe("en")
	})
})

const mockFs = (files: memfs.DirectoryJSON): typeof nodeFsPromises => {
	const _memfs = memfs.createFsFromVolume(memfs.Volume.fromJSON(files))
	const lixFs = createNodeishMemoryFs()
	for (const prop in nodeFsPromises) {
		// @ts-ignore - memfs has the same interface as node:fs/promises
		if (typeof nodeFsPromises[prop] !== "function") continue
		// @ts-ignore - memfs dies not have a watch interface - quick fix should be updated
		if (nodeFsPromises[prop].name === "watch") {
			// @ts-ignore - memfs has the same interface as node:fs/promises
			vi.spyOn(nodeFsPromises, prop).mockImplementation(lixFs[prop])
		} else {
			// @ts-ignore - memfs has the same interface as node:fs/promises
			vi.spyOn(nodeFsPromises, prop).mockImplementation(_memfs.promises[prop])
		}
	}
	return _memfs.promises as any
}
