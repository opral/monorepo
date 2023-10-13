import { expect, it } from "vitest"
import { getLanguageFolder } from "./getLanguageFolder.js"
import { createNodeishMemoryFs } from "@lix-js/fs"

it("should find the language folder and contained language tags", async () => {
	const basePath = "/path/to/root"

	const nodeishFs = createNodeishMemoryFs()
	await nodeishFs.mkdir("/path/to/root/language", { recursive: true })
	await nodeishFs.writeFile("/path/to/root/language/en.json", "{}")
	await nodeishFs.writeFile("/path/to/root/language/de.json", "{}")
	const result = await getLanguageFolder({
		basePath,
		nodeishFs,
	})

	expect(result?.path).toBe("/path/to/root/language")
	expect(result?.languageTags).toEqual(["en", "de"])
})

it("should find the language folder when it matches a potential folder name", async () => {
	const nodeishFs = createNodeishMemoryFs()

	const basePath = "/path/to/root"
	await nodeishFs.mkdir("/path/to/root/lang", { recursive: true }) // Matched potential folder name
	const result = await getLanguageFolder({
		basePath,
		nodeishFs,
	})

	expect(result?.path).toBe("/path/to/root/lang")
})

it("should handle not finding the language folder", async () => {
	const basePath = "/path/to/root"

	const nodeishFs = createNodeishMemoryFs()
	await nodeishFs.mkdir("/path/to/root/folder1", { recursive: true })
	const result = await getLanguageFolder({ basePath, nodeishFs })

	expect(result?.path).toBeUndefined()
})

it("should find the language folder within subfolders", async () => {
	const basePath = "/path/to/root"
	const nodeishFs = createNodeishMemoryFs()

	await nodeishFs.mkdir("/path/to/root/nested/folder/language", { recursive: true })
	const result = await getLanguageFolder({ basePath, nodeishFs })

	expect(result?.path).toBe("/path/to/root/nested/folder/language")
})

it("should skip on directories in .gitignore files", async () => {
	const basePath = "/path/to/root"

	// create gitignore file with folder1 in it
	const nodeishFs = createNodeishMemoryFs()

	await nodeishFs.mkdir("/path/to/root", { recursive: true })
	await nodeishFs.writeFile("/path/to/root/.gitignore", "folder1")

	// Create a subfolder with a language folder inside
	await nodeishFs.mkdir("/path/to/root/folder1/language", { recursive: true })

	// Act
	const result = await getLanguageFolder({ basePath, nodeishFs })

	// Assert
	expect(result?.path).toBeUndefined()
})
