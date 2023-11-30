import { assert, describe, it } from "vitest"
import { isAbsolutePath } from "./isAbsolutePath.js"

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
