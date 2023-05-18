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
	// testing characters is important. see bug https://github.com/inlang/inlang/issues/785
	const textInFirstFile = `
	  Testing a variety of characters. 

		Testing Umlaute äöüÄÖÜß
		Testing Chinese 汉字
		Testing Japanese かんじ
		Testing Korean 한국어
		Testing Arabic العَرَبِيَّة
		Testing Hebrew עִבְרִית
		Testing Russian русский язык
		Testing Greek ελληνικά
		Testing Thai ภาษาไทย
		Testing Hindi हिन्दी
		Testing Tamil தமிழ்
		Testing Georgian ქართული
		Testing Armenian հայերեն		
	`

	const textInSecondFile = `
		Some more text in the second file.
	`

	test("readdir", async () => {
		expect(await fs.readdir(tempDir)).toEqual([])
	})

	test("recursive mkdir", async () => {
		expect(await fs.mkdir(`${tempDir}/home/user1/documents/`, { recursive: true })).toMatch(
			/^.*\/home\/?$/,
		)
		expect(await fs.mkdir(`${tempDir}/home/user1/downloads/`, { recursive: true })).toMatch(
			/^.*\/home\/user1\/downloads\/?$/,
		)
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
		await fs.writeFile(`${tempDir}/home/user1/documents/file1`, textInFirstFile)
		await fs.writeFile(`${tempDir}/file2`, textInSecondFile)

		expect(await fs.readdir(`${tempDir}/home/user1/documents/`)).toEqual(["file1"])
		const dirents = await fs.readdir(tempDir)
		expect(dirents).toContain("home")
		expect(dirents).toContain("file2")
		expect(dirents).toHaveLength(2)

		expect(
			await fs.readFile(`${tempDir}/home/user1/documents/file1`, { encoding: "utf-8" }),
		).toEqual(textInFirstFile)

		expect(await fs.readFile(`${tempDir}/file2`, { encoding: "utf-8" })).toEqual(textInSecondFile)
	})

	test("r/w an empty file", async () => {
		await fs.writeFile(`${tempDir}/file3`, "")
		expect(await fs.readFile(`${tempDir}/file3`, { encoding: "utf-8" })).toEqual("")
		expect(await fs.readFile(`${tempDir}/file3`)).toHaveLength(0)
	})

	test("symlink", async () => {
		await fs.symlink(
			`${tempDir}/home/./user1/../user1/documents///./file1`,
			`${tempDir}/file1.link`,
		)
		await fs.symlink(`${tempDir}/file3`, `${tempDir}/file3.link`)
		await fs.symlink(`${tempDir}/home/user1`, `${tempDir}/user1.link`)

		expect(await fs.readFile(`${tempDir}/file1.link`, { encoding: "utf-8" })).toEqual(
			textInFirstFile,
		)
		expect(await fs.readFile(`${tempDir}/file3.link`, { encoding: "utf-8" })).toEqual("")
		expect(await fs.readdir(`${tempDir}/user1.link`)).toEqual(["documents", "downloads"])

		const dirents = await fs.readdir(tempDir)
		expect(dirents).toHaveLength(6)
		expect(dirents).toContain("file1.link")
		expect(dirents).toContain("file3.link")
		expect(dirents).toContain("user1.link")
	})

	test("readlink", async () => {
		expect(await fs.readlink(`${tempDir}/file1.link`)).toEqual(
			`${tempDir}/home/./user1/../user1/documents///./file1`,
		)

		expect(await fs.readlink(`${tempDir}/file3.link`)).toEqual(`${tempDir}/file3`)

		expect(await fs.readlink(`${tempDir}/user1.link`)).toEqual(`${tempDir}/home/user1`)
	})

	test("stat/lstat", async () => {
		const stats = {
			user1: await fs.lstat(`${tempDir}/user1.link`),
			file1: await fs.lstat(`${tempDir}/file1.link`),
			file2: await fs.stat(`${tempDir}/file2`),
			home: await fs.stat(`${tempDir}/home`),
		}
		expect([stats.user1.isFile(), stats.user1.isDirectory(), stats.user1.isSymbolicLink()]).toEqual(
			[false, false, true],
		)

		expect([stats.file1.isFile(), stats.file1.isDirectory(), stats.file1.isSymbolicLink()]).toEqual(
			[false, false, true],
		)

		expect([stats.file2.isFile(), stats.file2.isDirectory(), stats.file2.isSymbolicLink()]).toEqual(
			[true, false, false],
		)

		expect([stats.home.isFile(), stats.home.isDirectory(), stats.home.isSymbolicLink()]).toEqual([
			false,
			true,
			false,
		])
	})

	test("unlink", async () => {
		await fs.unlink(`${tempDir}/user1.link`)
		await fs.unlink(`${tempDir}/file1.link`)
		await fs.unlink(`${tempDir}/file3.link`)

		const dirents = await fs.readdir(tempDir)
		expect(dirents).toHaveLength(3)
		expect(dirents).not.toContain("file1.link")
		expect(dirents).not.toContain("file3.link")
		expect(dirents).not.toContain("user1.link")
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

		await fs.writeFile(`${tempDir}/home/user1/documents/file1`, textInFirstFile)
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
