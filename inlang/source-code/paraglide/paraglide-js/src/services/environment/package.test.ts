import { describe, it, expect, vi } from "vitest"
import { createNodeishMemoryFs, type NodeishFilesystem } from "@lix-js/fs"
import memfs from "memfs"
import nodeFsPromises from "node:fs/promises"
import { findPackageJson } from "./package.js"

describe("findPackageJson", () => {
	it("returns the path to the package.json file if it exists", async () => {
		const fs = mockFiles({
			"/package.json": JSON.stringify({
				name: "test",
			}),
		})

		const result = await findPackageJson(fs, "/")
		expect(result).toBe("/package.json")
	})

	it("returns undefined if no package.json file exists", async () => {
		const fs = mockFiles({})

		const result = await findPackageJson(fs, "/")
		expect(result).toBe(undefined)
	})
})

const mockFiles = (files: memfs.NestedDirectoryJSON) => {
	const _memfs = memfs.createFsFromVolume(memfs.Volume.fromNestedJSON(files))
	const lixFs = createNodeishMemoryFs()
	for (const prop in nodeFsPromises) {
		// @ts-ignore - memfs has the same interface as node:fs/promises
		if (typeof nodeFsPromises[prop] !== "function") continue

		// @ts-ignore - memfs dies not have a watch interface - quick fix should be updated
		if (nodeFsPromises[prop].name === "watch") {
			// @ts-ignore - memfs has the same interface as node:fs/promises
			vi.spyOn(_memfs.promises, prop).mockImplementation(lixFs[prop])
		} else {
			// @ts-ignore - memfs has the same interface as node:fs/promises
			vi.spyOn(_memfs.promises, prop)
		}
	}
	return _memfs.promises as NodeishFilesystem
}
