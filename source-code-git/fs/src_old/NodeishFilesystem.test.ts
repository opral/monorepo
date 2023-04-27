import { test, expect, afterAll, describe } from "vitest"
import type { NodeishFilesystem } from "./schema.js"

const runFsTestSuite = (name: string, tempDir: string, fs: NodeishFilesystem) =>
	describe(name, async () => {
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

			expect(await fs.readFile(`${tempDir}/home/user1/documents/file1`, "utf8")).toEqual(
				"text in the first file",
			)

			expect(await fs.readFile(`${tempDir}/file2`, "utf8")).toEqual("text in the second file")
		})

		describe("throw errors", async () => {
			test("rm", async () => {
				await expect(async () => await fs.rm(`${tempDir}/home/dne/dne2`)).rejects.toThrow(/ENOENT/)

				await expect(async () => await fs.rm(`${tempDir}/home/dne`)).rejects.toThrow(/ENOENT/)

				await expect(async () => await fs.rm(`${tempDir}/home/user1`)).rejects.toThrow(/EISDIR/)
			})

			test("mkdir", async () => {
				await expect(async () => await fs.mkdir(`${tempDir}/home/dne/dne2`)).rejects.toThrow(
					/ENOENT/,
				)
			})

			test("writeFile", async () => {
				await expect(
					async () => await fs.readFile(`${tempDir}/home/dne/file`, "utf8"),
				).rejects.toThrow(/ENOENT/)
			})

			test("readFile", async () => {
				await expect(async () => await fs.readFile(`${tempDir}/home/dne`, "utf8")).rejects.toThrow(
					/ENOENT/,
				)

				await expect(
					async () => await fs.readFile(`${tempDir}/home/user1`, "utf8"),
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
			await fs.rm(`${tempDir}/home/user1/documents/file1`)
			await expect(
				async () => await fs.readFile(`${tempDir}/home/user1/documents/file1`, "utf8"),
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
	})

/* global process */
if (process?.versions?.node) {
	const _fs = await import("node:fs/promises")
	const join = await import("node:path").then((path) => path.join)
	const tmpdir = await import("node:os").then((os) => os.tmpdir)

	runFsTestSuite("node fs", await _fs.mkdtemp(join(tmpdir(), "__vitest_test-")), _fs)
}
import { createMemoryFs } from "./createMemoryFs.js"
import { toNodeFs } from "./toNodeFs.js"
runFsTestSuite("memory fs", "", toNodeFs(createMemoryFs()))
