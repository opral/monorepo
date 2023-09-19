import { expect, it, describe } from "vitest"
import { getLanguageFolderPath } from "./getLanguageFolderPath.js"
import { createNodeishMemoryFs } from "@lix-js/fs"
import path from "node:path"

describe("getLanguageFolderPath", () => {
	it("should find the language folder", async () => {
		// Arrange
		const rootDir = "/path/to/root"
		const pathJoin = (...args: string[]) => args.join("/")

		const nodeishFs = createNodeishMemoryFs()
		await nodeishFs.mkdir("/path/to/root/language", { recursive: true })

		const args = {
			rootDir,
			nodeishFs,
			pathJoin,
		}

		// Act
		const result = await getLanguageFolderPath(args)

		// Assert
		expect(result).toBe("/path/to/root/language")
	})

	it("should find the language folder when it matches a potential folder name", async () => {
		// Arrange
		const rootDir = "/path/to/root"
		const pathJoin = (...args: string[]) => args.join("/")

		const nodeishFs = createNodeishMemoryFs()
		await nodeishFs.mkdir("/path/to/root/lang", { recursive: true }) // Matched potential folder name

		const args = {
			rootDir,
			nodeishFs,
			pathJoin,
		}

		// Act
		const result = await getLanguageFolderPath(args)

		// Assert
		expect(result).toBe("/path/to/root/lang")
	})

	it("should handle not finding the language folder", async () => {
		// Arrange
		const rootDir = "/path/to/root"

		const nodeishFs = createNodeishMemoryFs()
		await nodeishFs.mkdir("/path/to/root/folder1", { recursive: true })

		const args = {
			rootDir,
			nodeishFs, // Use a mock that doesn't contain a language folder.
			pathJoin: path.join,
		}

		// Act
		const result = await getLanguageFolderPath(args)

		// Assert
		expect(result).toBeUndefined()
	})

	it("should find the language folder within subfolders", async () => {
		// Arrange
		const rootDir = "/path/to/root"
		const nodeishFs = createNodeishMemoryFs()

		// Create nested subfolders with a language folder inside
		await nodeishFs.mkdir("/path/to/root/nested/folder/language", { recursive: true })

		const args = {
			rootDir,
			nodeishFs,
			pathJoin: path.join,
		}

		// Act
		const result = await getLanguageFolderPath(args)

		// Assert
		expect(result).toBe("/path/to/root/nested/folder/language")
	})

	it("should skip on directories in .gitignore files", async () => {
		// Arrange
		const rootDir = "/path/to/root"

		// create gitignore file with folder1 in it
		const nodeishFs = createNodeishMemoryFs()

		await nodeishFs.mkdir("/path/to/root", { recursive: true })
		await nodeishFs.writeFile("/path/to/root/.gitignore", "folder1")

		// Create a subfolder with a language folder inside
		await nodeishFs.mkdir("/path/to/root/folder1/language", { recursive: true })

		const args = {
			rootDir,
			nodeishFs, // Use the nodeishFs where .gitignore is set up.
			pathJoin: path.join,
		}

		// Act
		const result = await getLanguageFolderPath(args)

		// Assert
		expect(result).toBeUndefined()
	})
})
