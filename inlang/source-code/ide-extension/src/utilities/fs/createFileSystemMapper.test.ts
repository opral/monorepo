import { describe, it, expect, vi, beforeEach } from "vitest"
import * as _path from "node:path"
import { createFileSystemMapper } from "./createFileSystemMapper.js"

describe("createFileSystemMapper", () => {
	const normalizedBase = "/base/path"
	let mockFs: FileSystem

	beforeEach(() => {
		mockFs = {
			// TODO: Fix the type of the mockFs object – fix overloads
			writeFile: vi.fn(),
			// @ts-expect-error
			readFile: vi.fn(),
			// @ts-expect-error
			readdir: vi.fn(),
			rm: vi.fn(),
			rmdir: vi.fn(),
			unlink: vi.fn(),
			// @ts-expect-error
			readlink: vi.fn(),
			symlink: vi.fn(),
			// @ts-expect-error
			mkdir: vi.fn(),
			// @ts-expect-error
			stat: vi.fn(),
			// @ts-expect-error
			watch: vi.fn(),
			// @ts-expect-error
			lstat: vi.fn(),
		}
	})

	it("should map writeFile correctly", async () => {
		const fs = createFileSystemMapper(normalizedBase, mockFs)
		const testPath = "/test/path"

		await fs.writeFile(testPath, "test content")

		expect(mockFs.writeFile).toHaveBeenCalledWith(
			testPath.startsWith(normalizedBase) ? testPath : _path.resolve(normalizedBase, testPath),
			"test content",
			undefined
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

	it("should map rm correctly", async () => {
		const fs = createFileSystemMapper(normalizedBase, mockFs)
		const testPath = "/test/path"

		await fs.rm(testPath, { recursive: true })

		expect(mockFs.rm).toHaveBeenCalledWith(
			testPath.startsWith(normalizedBase) ? testPath : _path.resolve(normalizedBase, testPath),
			{ recursive: true }
		)
	})

	it("should map rmdir correctly", async () => {
		const fs = createFileSystemMapper(normalizedBase, mockFs)
		const testPath = "/test/path"

		await fs.rmdir(testPath)

		expect(mockFs.rmdir).toHaveBeenCalledWith(
			testPath.startsWith(normalizedBase) ? testPath : _path.resolve(normalizedBase, testPath)
		)
	})

	it("should map unlink correctly", async () => {
		const fs = createFileSystemMapper(normalizedBase, mockFs)
		const testPath = "/test/path"

		await fs.unlink(testPath)

		expect(mockFs.unlink).toHaveBeenCalledWith(
			testPath.startsWith(normalizedBase) ? testPath : _path.resolve(normalizedBase, testPath)
		)
	})

	// make tests for readdir, readlink, symlink, stat, lstat
	it("should map readlink correctly", async () => {
		const fs = createFileSystemMapper(normalizedBase, mockFs)
		const testPath = "/test/path"

		await fs.readlink(testPath)

		expect(mockFs.readlink).toHaveBeenCalledWith(
			testPath.startsWith(normalizedBase) ? testPath : _path.resolve(normalizedBase, testPath)
		)
	})

	it("should map symlink correctly", async () => {
		const fs = createFileSystemMapper(normalizedBase, mockFs)
		const testPath = "/test/path"

		await fs.symlink(testPath, "/test/target")

		expect(mockFs.symlink).toHaveBeenCalledWith(
			testPath.startsWith(normalizedBase) ? testPath : _path.resolve(normalizedBase, testPath),
			"/test/target"
		)
	})

	it("should map mkdir correctly", async () => {
		const fs = createFileSystemMapper(normalizedBase, mockFs)
		const testPath = "/test/path"

		await fs.mkdir(testPath, { recursive: true })

		expect(mockFs.mkdir).toHaveBeenCalledWith(
			testPath.startsWith(normalizedBase) ? testPath : _path.resolve(normalizedBase, testPath),
			{ recursive: true }
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
