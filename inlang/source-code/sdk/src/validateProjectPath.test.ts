import { assert, describe, expect, it } from "vitest"
import {
	assertValidProjectPath,
	isAbsolutePath,
	isInlangProjectPath,
	pathExists,
} from "./validateProjectPath.js"
import { mockRepo } from "@lix-js/client"

describe("isAbsolutePath", () => {
	it("should correctly identify Unix absolute paths", () => {
		assert.isTrue(isAbsolutePath("/home/user/documents/file.txt"))
		assert.isTrue(isAbsolutePath("/usr/local/bin/script.sh"))
		assert.isFalse(isAbsolutePath("relative/path/to/file.txt"))
	})

	it("should correctly identify Windows absolute paths", () => {
		assert.isTrue(isAbsolutePath("C:\\Users\\User\\Documents\\File.txt"))
		assert.isTrue(isAbsolutePath("C:/Users/user/project.inlang/settings.json"))
		assert.isFalse(isAbsolutePath("Projects\\Project1\\source\\file.txt"))
	})

	it("should handle edge cases", () => {
		assert.isFalse(isAbsolutePath("")) // Empty path should return false
		assert.isFalse(isAbsolutePath("relative/path/../file.txt")) // Relative path with ".." should return false
		assert.isFalse(isAbsolutePath("../relative/path/to/file.txt"))
		assert.isFalse(isAbsolutePath("./relative/path/to/file.txt"))
	})
})

describe("isInlangProjectPath", () => {
	it("should correctly identify valid inlang project paths", () => {
		assert.isTrue(isInlangProjectPath("/path/to/orange-mouse.inlang"))
		assert.isFalse(isInlangProjectPath("relative/path/to/file.txt"))
		assert.isFalse(isInlangProjectPath("/path/to/.inlang"))
		assert.isFalse(isInlangProjectPath("/path/to/white-elephant.inlang/"))
		assert.isFalse(isInlangProjectPath("/path/to/blue-elephant.inlang/settings.json"))
	})
})

describe("assertValidProjectPath", () => {
	it("should not throw for valid project paths", () => {
		assert.doesNotThrow(() => assertValidProjectPath("/path/to/brown-mouse.inlang"))
		assert.doesNotThrow(() => assertValidProjectPath("/path/to/green-elephant.inlang"))
	})

	it("should throw for invalid project paths", () => {
		assert.throws(() => assertValidProjectPath("relative/path/to/flying-lizard.inlang"))
		assert.throws(() => assertValidProjectPath("/path/to/loud-mouse.inlang/"))
		assert.throws(() => assertValidProjectPath("/path/to/green-elephant.inlang/settings.json"))
	})
})

// moar tests in paraglide-js/src/services/file-handling/exists.test.ts
describe("pathExists", () => {
	it("should work for files", async () => {
		const repo = await mockRepo()
		await repo.nodeishFs.writeFile("/test.txt", "hello")
		expect(await pathExists("/test.txt", repo.nodeishFs)).toBe(true)
		expect(await pathExists("/does-not-exist.txt", repo.nodeishFs)).toBe(false)
	})
	it("should work for directories", async () => {
		const repo = await mockRepo()
		await repo.nodeishFs.mkdir("/test/project.inlang", { recursive: true })
		expect(await pathExists("/test/project.inlang", repo.nodeishFs)).toBe(true)
		expect(await pathExists("/test/white-gorilla.inlang", repo.nodeishFs)).toBe(false)
	})
})
