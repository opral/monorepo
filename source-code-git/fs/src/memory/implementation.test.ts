import { test, expect } from "vitest"
import { createMemoryFs } from "./implementation.js"
import type { Filesystem } from "../schema.js"

// Basic test, should be split into several more elaborate tests later

test("MemoryFs", async () => {
	const fs: Filesystem = createMemoryFs()
	expect(await fs.readdir("/")).toEqual([])

	await fs.mkdir("home/user1/documents/")
	await fs.mkdir("home/user1/downloads")
	expect(await fs.readdir("/")).toEqual(["home"])
	expect(await fs.readdir("/home/user1/")).toEqual(["documents", "downloads"])

	await fs.writeFile("/home/user1/documents/file1", "text in the first file")
	await fs.writeFile("/file2", "text in the second file")
	expect(await fs.readdir("/home/user1/documents/")).toEqual(["file1"])
	expect(await fs.readdir("/")).toEqual(["home", "file2"])

	expect(await fs.readFile("/home/user1/documents/file1")).toEqual("text in the first file")
	expect(await fs.readFile("/file2")).toEqual("text in the second file")

	// relative paths
	await fs.writeFile("/home/user1/documents/../file3", "text in the third file")
	expect(await fs.readFile("./home/./user1/file3")).toEqual("text in the third file")

	const fsJson: Record<string, string> = await fs.toJson()
	// dirToJson
	expect(fsJson).toMatchSnapshot()

	// dirFromJson (circular references make this tricky to test)
	const newFs = await createMemoryFs().fromJson(fsJson)
	expect(await newFs.toJson()).toEqual(await fs.toJson())

	expect(await fs.readFile("./home/dne")).toBeUndefined()
	expect(await fs.readdir("./home/dne")).toBeUndefined()
	await fs.rm("/home/user1")
	expect(await fs.readdir("/home/user1")).toBeUndefined()
	expect(await fs.readdir("/home")).toEqual([])
})
