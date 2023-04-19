import { test, expect, afterAll, describe } from "vitest"
import type { Filesystem } from "./schema.js"

declare module "vitest" {
	export interface TestContext {
		tempDir: string
		fs: Filesystem
	}
}

const runFsTestSuite = (name: string, tempDir: string, fs: Filesystem) => describe(name, async () => {
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

	test("file r/w", async () => {
		await fs.writeFile(`${tempDir}/home/user1/documents/file1`, "text in the first file")
		await fs.writeFile(`${tempDir}/file2`, "text in the second file")

		expect(await fs.readdir(`${tempDir}/home/user1/documents/`)).toEqual(["file1"])
		const dirents = await fs.readdir(tempDir)
		expect(dirents).toContain("home")
		expect(dirents).toContain("file2")
		expect(dirents).toHaveLength(2)

		expect(await fs.readFile(`${tempDir}/home/user1/documents/file1`, "utf8"))
			.toEqual("text in the first file")

		expect(await fs.readFile(`${tempDir}/file2`, "utf8"))
			.toEqual("text in the second file")
	})

	describe("throw errors", async () => {
		test("rm", async () => {
			expect(async () => await fs.rm(`${tempDir}/home/dne/dne2`)).rejects
				.toThrow(/ENOENT/)

			expect(async () => await fs.rm(`${tempDir}/home/dne`)).rejects
				.toThrow(/ENOENT/)

			expect(async () => await fs.rm(`${tempDir}/home/user1`)).rejects
				.toThrow(/EISDIR/)
		})

		test("mkdir", async () => {
			expect(async () => await fs.mkdir(`${tempDir}/home/dne/dne2`)).rejects
				.toThrow(/ENOENT/)
		})

		test("writeFile", async () => {
			expect(async () => await fs.readFile(`${tempDir}/home/dne/file`, "utf8")).rejects
				.toThrow(/ENOENT/)
		})

		test("readFile", async () => {
			expect(async () => await fs.readFile(`${tempDir}/home/dne`, "utf8")).rejects
				.toThrow(/ENOENT/)

			expect(async () => await fs.readFile(`${tempDir}/home/user1`, "utf8")).rejects
				.toThrow(/EISDIR/)
		})

		test("readdir", async () => {
			expect(async () => await fs.readdir(`${tempDir}/home/dne`)).rejects
				.toThrow(/ENOENT/)

			expect(async () => await fs.readdir(`${tempDir}/home/user1/documents/file1`)).rejects
				.toThrow(/ENOTDIR/)
		})
	})

	test("toJson", async () => {
		const fsJson = await fs.toJson({ dir: tempDir })

		expect(Object.keys(fsJson)).toHaveLength(2)

		expect(Object.keys(fsJson))
		.toEqual(expect.arrayContaining([
			expect.stringContaining("/file2"),
			expect.stringContaining("/home/user1/documents/file1")
		]))

		expect(Object.values(fsJson))
		.toEqual(expect.arrayContaining([
			expect.stringContaining("text in the first file"),
			expect.stringContaining("text in the second file")
		]))

	})

	test("fromJson", async () => {
		const fsJson = await fs.toJson({ dir: tempDir })
		await fs.rm(tempDir, { recursive: true })
		await fs.fromJson(fsJson)
		expect(await fs.toJson({ dir: tempDir })).toEqual(fsJson)
	})

	test("rm", async () => {
		await fs.rm(`${tempDir}/home/user1`, { recursive: true })

		expect(async () => await fs.readFile(`${tempDir}/home/user1`, "utf8")).rejects
			.toThrow(/ENOENT/)

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

})

if (process?.versions?.node) {
	const _fs = await import("node:fs/promises")
	const join = await import("node:path").then((path) => path.join)
	const tmpdir = await import("node:os").then((os) => os.tmpdir)
	const fromNodeFs = await import("./node/implementation.js").then((imp) => imp.fromNodeFs)

	runFsTestSuite(
		"node fs", 
		await _fs.mkdtemp(join(tmpdir(), "__vitest_test-")),
		fromNodeFs(_fs)
	)
}

/*
import { createMemoryFs } from  "./memory/implementation.js"
runFsTestSuite("memory fs", "", createMemoryFs())
*/
