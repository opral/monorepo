import type { NodeishFilesystemSubset } from "@inlang/plugin"
import { describe, it, expect } from "vitest"
import { createNodeishFsWithAbsolutePaths } from "./createNodeishFsWithAbsolutePaths.js"

describe("createNodeishFsWithAbsolutePaths", () => {
	it("throws an error if basePath is not an absolute path", () => {
		const invalidBasePath = "relative/path"
		const nodeishFs: NodeishFilesystemSubset = {
			// @ts-expect-error
			readFile: async () => Promise.resolve(new Uint8Array(0)),
			readdir: async () => Promise.resolve([]),
			mkdir: async () => Promise.resolve(""),
			writeFile: async () => Promise.resolve(),
		}

		expect(() =>
			createNodeishFsWithAbsolutePaths({ basePath: invalidBasePath, nodeishFs })
		).toThrowError("The argument `settingsFilePath` of `loadProject()` must be an absolute path.")
	})

	it("intercepts paths correctly for readFile", async () => {
		const basePath = "/absolute/path"
		const filePath = "file.txt"
		const expectedPath = "/absolute/path/file.txt"

		const nodeishFs: NodeishFilesystemSubset = {
			// @ts-expect-error
			readFile: async (path) => {
				expect(path).toBe(expectedPath)
				return Promise.resolve(new Uint8Array(0))
			},
			readdir: async () => Promise.resolve([]),
			mkdir: async () => Promise.resolve(""),
			writeFile: async () => Promise.resolve(),
		}

		const interceptedFs = createNodeishFsWithAbsolutePaths({ basePath, nodeishFs })
		await interceptedFs.readFile(filePath, { encoding: "utf-8" })
	})

	it("intercepts paths correctly for readdir", async () => {
		const basePath = "/absolute/path"
		const dirPath = "dir"
		const expectedPath = "/absolute/path/dir"

		const nodeishFs: NodeishFilesystemSubset = {
			// @ts-expect-error
			readFile: async () => Promise.resolve(new Uint8Array(0)),
			readdir: async (path) => {
				expect(path).toBe(expectedPath)
				return Promise.resolve([])
			},
			mkdir: async () => Promise.resolve(""),
			writeFile: async () => Promise.resolve(),
		}

		const interceptedFs = createNodeishFsWithAbsolutePaths({ basePath, nodeishFs })
		await interceptedFs.readdir(dirPath)
	})

	it("intercepts paths correctly for mkdir", async () => {
		const basePath = "/absolute/path"
		const dirPath = "newDir"
		const expectedPath = "/absolute/path/newDir"

		const nodeishFs: NodeishFilesystemSubset = {
			// @ts-expect-error
			readFile: async () => Promise.resolve(new Uint8Array(0)),
			readdir: async () => Promise.resolve([]),
			mkdir: async (path) => {
				expect(path).toBe(expectedPath)
				return Promise.resolve("")
			},
			writeFile: async () => Promise.resolve(),
		}

		const interceptedFs = createNodeishFsWithAbsolutePaths({ basePath, nodeishFs })
		await interceptedFs.mkdir(dirPath)
	})

	it("intercepts paths correctly for writeFile", async () => {
		const basePath = "/absolute/path"
		const filePath = "file.txt"
		const expectedPath = "/absolute/path/file.txt"
		const data = "Hello, World!"

		const nodeishFs: NodeishFilesystemSubset = {
			// @ts-expect-error
			readFile: async () => Promise.resolve(new Uint8Array(0)),
			readdir: async () => Promise.resolve([]),
			mkdir: async () => Promise.resolve(""),
			writeFile: async (path, content) => {
				expect(path).toBe(expectedPath)
				expect(content).toBe(data)
				return Promise.resolve()
			},
		}

		const interceptedFs = createNodeishFsWithAbsolutePaths({ basePath, nodeishFs })
		await interceptedFs.writeFile(filePath, data)
	})
})
