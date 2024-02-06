import { createNodeishMemoryFs } from "@lix-js/fs"
import { describe, expect, it } from "vitest"
import { closestInlangProject } from "./closestInlangProject.js"

describe("closestInlangProject", async () => {
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

	const projects = [
		{ projectPath: "/root/path/folder1.inlang" },
		{ projectPath: "/root/path/folder2.inlang" },
		{ projectPath: "/root/path/folder2/project.inlang" },
	]

	it("should find the closest inlang project", async () => {
		const result = await closestInlangProject({
			workingDirectory: "/root/path",
			projects,
		})

		expect(result).toEqual({ projectPath: "/root/path/folder1.inlang" })
	})

	it("should return undefined if no inlang project is found", async () => {
		const result = await closestInlangProject({
			workingDirectory: "/root/path/folder3",
			projects,
		})

		expect(result).toEqual(undefined)
	})

	it("should handle workingDirectory being empty", async () => {
		const result = await closestInlangProject({
			workingDirectory: "",
			projects,
		})

		expect(result).toEqual(undefined)
	})
})
