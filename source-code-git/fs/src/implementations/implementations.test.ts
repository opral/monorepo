import { test, expect, afterAll, describe } from "vitest"
import type { NodeishFilesystem } from "../interface.js"
import { createMemoryFs } from "./memoryFs.js"

describe("node fs", async () => {
	const fs = await import("node:fs/promises")
	const tempDir = new URL("./__test", import.meta.url).pathname
	await fs.mkdir(tempDir, { recursive: true })

	await runFsTestSuite("node fs", tempDir, fs)
})

describe("memory fs", async () => {
	const fs = createMemoryFs()

	await runFsTestSuite("memory fs", "", fs)
})

const runFsTestSuite = async (name: string, tempDir: string, fs: NodeishFilesystem) => {
	test("readdir", async () => {
		expect(await fs.readdir(tempDir)).toEqual([])
	})

	test("recursive mkdir", async () => {
		await fs.mkdir(`${tempDir}/home/user1/documents/`, { recursive: true })
		await fs.mkdir(`${tempDir}/home/user1/downloads`, { recursive: true })
		expect(await fs.readdir(tempDir)).toEqual(["home"])
		expect(await fs.readdir(`${tempDir}/home/user1/`)).toEqual(["documents", "downloads"])
		expect(await fs.readdir(`${tempDir}/home/user1/documents`)).toEqual([])
	})

	test("funny paths", async () => {
		expect(await fs.readdir(`${tempDir}///.//`)).toEqual(["home"])
		expect(await fs.readdir(`${tempDir}/home/user1/../user1/./`)).toEqual([
			"documents",
			"downloads",
		])
		expect(await fs.readdir(`${tempDir}/home/./../home/.//user1/documents`)).toEqual([])
	})

	test("file r/w", async () => {
		await fs.writeFile(`${tempDir}/home/user1/documents/file1`, "text in the first file")
		await fs.writeFile(`${tempDir}/file2`, "text in the second file")

		expect(await fs.readdir(`${tempDir}/home/user1/documents/`)).toEqual(["file1"])
		const dirents = await fs.readdir(tempDir)
		expect(dirents).toContain("home")
		expect(dirents).toContain("file2")
		expect(dirents).toHaveLength(2)

		expect(
			await fs.readFile(`${tempDir}/home/user1/documents/file1`, { encoding: "utf-8" }),
		).toEqual("text in the first file")

		expect(await fs.readFile(`${tempDir}/file2`, { encoding: "utf-8" })).toEqual(
			"text in the second file",
		)
	})

	test("r/w an empty file", async () => {
		await fs.writeFile(`${tempDir}/file3`, "")
		expect(await fs.readFile(`${tempDir}/file3`, { encoding: "utf-8" })).toEqual("")
	})

	describe("throw errors", async () => {
		test("rm", async () => {
			await expect(async () => await fs.rm(`${tempDir}/home/dne/dne2`)).rejects.toThrow(/ENOENT/)

			await expect(async () => await fs.rm(`${tempDir}/home/dne`)).rejects.toThrow(/ENOENT/)

			await expect(async () => await fs.rm(`${tempDir}/home/user1`)).rejects.toThrow(/EISDIR/)
		})

		test("mkdir", async () => {
			await expect(async () => await fs.mkdir(`${tempDir}/home/dne/dne2`)).rejects.toThrow(/ENOENT/)
		})

		test("writeFile", async () => {
			await expect(
				async () => await fs.readFile(`${tempDir}/home/dne/file`, { encoding: "utf-8" }),
			).rejects.toThrow(/ENOENT/)
		})

		test("readFile", async () => {
			await expect(
				async () => await fs.readFile(`${tempDir}/home/dne`, { encoding: "utf-8" }),
			).rejects.toThrow(/ENOENT/)

			await expect(
				async () => await fs.readFile(`${tempDir}/home/user1`, { encoding: "utf-8" }),
			).rejects.toThrow(/EISDIR/)
		})

		test("readdir", async () => {
			await expect(async () => await fs.readdir(`${tempDir}/home/dne`)).rejects.toThrow(/ENOENT/)

			await expect(
				async () => await fs.readdir(`${tempDir}/home/user1/documents/file1`),
			).rejects.toThrow(/ENOTDIR/)
		})
	})

	test("rm", async () => {
		await expect(async () => await fs.rm(`${tempDir}/home/user1/documents/`)).rejects.toThrow(
			/EISDIR/,
		)

		await fs.rm(`${tempDir}/home/user1/documents/file1`)
		await expect(
			async () => await fs.readFile(`${tempDir}/home/user1/documents/file1`, { encoding: "utf-8" }),
		).rejects.toThrow(/ENOENT/)

		await fs.writeFile(`${tempDir}/home/user1/documents/file1`, "text in the first file")
		await fs.rm(`${tempDir}/home/user1`, { recursive: true })

		await expect(async () => await fs.readdir(`${tempDir}/home/user1`)).rejects.toThrow(/ENOENT/)

		expect(await fs.readdir(`${tempDir}/home`)).toEqual([])
	})

	test("rmdir", async () => {
		await fs.mkdir(`${tempDir}/dir1`)
		expect(await fs.readdir(tempDir)).toContain("dir1")
		await fs.rmdir(`${tempDir}/dir1`)
		expect(await fs.readdir(tempDir)).not.toContain("dir1")
	})

	afterAll(async () => {
		if (tempDir !== "") {
			await fs.rm(tempDir, { recursive: true })
		}
	})
}
