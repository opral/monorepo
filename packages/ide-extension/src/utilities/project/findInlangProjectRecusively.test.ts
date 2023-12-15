import { describe, expect, it } from "vitest"
import { findInlangProjectRecursively } from "./findInlangProjectRecusively.js"
import { createNodeishMemoryFs } from "@lix-js/fs"

describe("findInlangProjectRecursively", async () => {
	const nodeishFs = createNodeishMemoryFs()

	// Create mock files and folders
	await nodeishFs.mkdir("/root/path", { recursive: true })
	await nodeishFs.mkdir("/root/path/folder1", { recursive: true })
	await nodeishFs.mkdir("/root/path/folder2", { recursive: true })
	await nodeishFs.mkdir("/root/path/folder3", { recursive: true })
	// Create two inlang projects in root
	await nodeishFs.mkdir("/root/path/folder1.inlang", { recursive: true })
	await nodeishFs.mkdir("/root/path/folder2.inlang", { recursive: true })
	// Create an inlang project in folder 2
	await nodeishFs.mkdir("/root/path/folder2/project.inlang", { recursive: true })
	await nodeishFs.writeFile("/root/path/file1.txt", "")
	await nodeishFs.writeFile("/root/path/file2.txt", "")

	it("should find folders with the specified extension", async () => {
		const result = await findInlangProjectRecursively({
			rootPath: "/root/path",
			nodeishFs,
		})

		expect(result).toEqual([
			"/root/path/folder2/project.inlang",
			"/root/path/folder1.inlang",
			"/root/path/folder2.inlang",
		])
	})

	it("should handle errors gracefully when readdir fails", async () => {
		// Mock readdir method of nodeishFs to throw an error
		nodeishFs.readdir = async () => {
			throw new Error("Mocked readdir error")
		}

		const result = await findInlangProjectRecursively({ rootPath: "/root/path", nodeishFs })

		expect(result).toStrictEqual([])
	})

	it("should handle errors gracefully when stat fails", async () => {
		// Mock stat method of nodeishFs to throw an error
		nodeishFs.stat = async () => {
			throw new Error("Mocked stat error")
		}

		const result = await findInlangProjectRecursively({ rootPath: "/root/path", nodeishFs })

		expect(result).toStrictEqual([])
	})

	it("should return an empty array for an empty path", async () => {
		// Mock readdir method of nodeishFs
		nodeishFs.readdir = async () => []

		const result = await findInlangProjectRecursively({ rootPath: "", nodeishFs })

		expect(result).toStrictEqual([])
	})
})
