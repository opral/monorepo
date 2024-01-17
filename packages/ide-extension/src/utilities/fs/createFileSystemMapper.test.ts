import { describe, it, expect, vi, beforeEach } from "vitest"
import * as _path from "node:path"
import { createFileSystemMapper } from "./createFileSystemMapper.js"
import type { NodeishFilesystem } from "@lix-js/fs"

describe("createFileSystemMapper", () => {
	const normalizedBase = "/base/path"
	let mockFs: NodeishFilesystem

	beforeEach(() => {
		mockFs = {
			writeFile: vi.fn(),
			// @ts-expect-error
			readFile: vi.fn(),
			readdir: vi.fn(),
			mkdir: vi.fn(),
			stat: vi.fn(),
			watch: vi.fn(),
			lstat: vi.fn(),
		}
	})

	it("should map writeFile correctly", async () => {
		const fs = createFileSystemMapper(normalizedBase, mockFs)
		const testPath = "/test/path"

		await fs.writeFile(testPath, "test content")

		expect(mockFs.writeFile).toHaveBeenCalledWith(
			testPath.startsWith(normalizedBase) ? testPath : _path.resolve(normalizedBase, testPath),
			"test content"
		)
	})

	it("should map readFile correctly", async () => {
		const fs = createFileSystemMapper(normalizedBase, mockFs)
		const testPath = "/test/path"

		await fs.readFile(testPath, { encoding: "utf-8" })

		expect(mockFs.readFile).toHaveBeenCalledWith(
			testPath.startsWith(normalizedBase) ? testPath : _path.resolve(normalizedBase, testPath),
			{ encoding: "utf-8" }
		)
	})

	it("should map readdir correctly", async () => {
		const fs = createFileSystemMapper(normalizedBase, mockFs)
		const testPath = "/test/path"

		await fs.readdir(testPath)

		expect(mockFs.readdir).toHaveBeenCalledWith(
			testPath.startsWith(normalizedBase) ? testPath : _path.resolve(normalizedBase, testPath)
		)
	})

	it("should map mkdir correctly", async () => {
		const fs = createFileSystemMapper(normalizedBase, mockFs)
		const testPath = "/test/path"

		await fs.mkdir(testPath)

		expect(mockFs.mkdir).toHaveBeenCalledWith(
			testPath.startsWith(normalizedBase) ? testPath : _path.resolve(normalizedBase, testPath)
		)
	})

	it("should map stat correctly", async () => {
		const fs = createFileSystemMapper(normalizedBase, mockFs)
		const testPath = "/test/path"

		await fs.stat(testPath)

		expect(mockFs.stat).toHaveBeenCalledWith(
			testPath.startsWith(normalizedBase) ? testPath : _path.resolve(normalizedBase, testPath)
		)
	})

	it("should map watch correctly", async () => {
		const fs = createFileSystemMapper(normalizedBase, mockFs)
		const testPath = "/test/path"

		await fs.watch(testPath, {})

		expect(mockFs.watch).toHaveBeenCalledWith(
			testPath.startsWith(normalizedBase) ? testPath : _path.resolve(normalizedBase, testPath),
			{}
		)
	})

	it("should map lstat correctly", async () => {
		const fs = createFileSystemMapper(normalizedBase, mockFs)
		const testPath = "/test/path"

		await fs.lstat(testPath)

		expect(mockFs.lstat).toHaveBeenCalledWith(
			testPath.startsWith(normalizedBase) ? testPath : _path.resolve(normalizedBase, testPath)
		)
	})
})
