import { describe, expect, it, beforeEach } from "vitest"
import { closestInlangProject } from "./closestInlangProject.js"
import * as fs from "node:fs/promises"
import * as os from "node:os"
import * as path from "node:path"

describe("closestInlangProject", () => {
	let tempDir: string

	// Create a temporary directory before each test
	beforeEach(async () => {
		tempDir = path.join(os.tmpdir(), "test-root")
		await fs.mkdir(tempDir, { recursive: true })
	})

	it("should find the closest inlang project", async () => {
		const rootPath = path.join(tempDir, "path")
		await fs.mkdir(rootPath, { recursive: true })
		await fs.mkdir(path.join(rootPath, "folder1"), { recursive: true })
		await fs.mkdir(path.join(rootPath, "folder2"), { recursive: true })
		await fs.mkdir(path.join(rootPath, "folder3"), { recursive: true })

		// Create inlang project directories
		await fs.mkdir(path.join(rootPath, "folder1.inlang"), { recursive: true })
		await fs.mkdir(path.join(rootPath, "folder2.inlang"), { recursive: true })
		await fs.mkdir(path.join(rootPath, "folder2", "project.inlang"), {
			recursive: true,
		})

		// Write some test files
		await fs.writeFile(path.join(rootPath, "file1.txt"), "")
		await fs.writeFile(path.join(rootPath, "file2.txt"), "")

		const projects = [
			{ projectPath: path.join(rootPath, "folder1.inlang") },
			{ projectPath: path.join(rootPath, "folder2.inlang") },
			{ projectPath: path.join(rootPath, "folder2", "project.inlang") },
		]

		const result = await closestInlangProject({
			workingDirectory: rootPath,
			projects,
		})

		expect(result).toEqual({
			projectPath: path.join(rootPath, "folder1.inlang"),
		})
	})

	it("should return undefined if no inlang project is found", async () => {
		const rootPath = path.join(tempDir, "path")
		await fs.mkdir(rootPath, { recursive: true })
		await fs.mkdir(path.join(rootPath, "folder3"), { recursive: true })

		const projects = [
			{ projectPath: path.join(rootPath, "folder1.inlang") },
			{ projectPath: path.join(rootPath, "folder2.inlang") },
			{ projectPath: path.join(rootPath, "folder2", "project.inlang") },
		]

		const result = await closestInlangProject({
			workingDirectory: path.join(rootPath, "folder3"),
			projects,
		})

		expect(result).toBeUndefined()
	})

	it("should handle workingDirectory being empty", async () => {
		const rootPath = path.join(tempDir, "path")
		await fs.mkdir(rootPath, { recursive: true })

		const projects = [
			{ projectPath: path.join(rootPath, "folder1.inlang") },
			{ projectPath: path.join(rootPath, "folder2.inlang") },
			{ projectPath: path.join(rootPath, "folder2", "project.inlang") },
		]

		const result = await closestInlangProject({
			workingDirectory: "",
			projects,
		})

		expect(result).toBeUndefined()
	})
})
