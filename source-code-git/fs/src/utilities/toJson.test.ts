import { it, describe, expect } from "vitest"
import { createMemoryFs } from "../implementations/memoryFs.js"
import { toJson } from "./toJson.js"

describe("toJson", async () => {
	const fs = createMemoryFs()
	await fs.writeFile("/file1.txt", "content1")
	await fs.writeFile("/file2.js", "content2")
	await fs.mkdir("/node_modules")
	await fs.writeFile("/node_modules/file3.js", "content3")

	// required to align with the fromJson function.
	it("should not prefix the path with a slash", async () => {
		const result = await toJson({ fs, matchers: ["**/*"], resolveFrom: "/" })
		expect(result).toEqual({
			"file1.txt": "content1",
			"file2.js": "content2",
			"node_modules/file3.js": "content3",
		})
	})

	it("should base64 encode files", async () => {
		const result = await toJson({
			fs,
			matchers: ["**/*"],
			resolveFrom: "/",
			encodeOutput: "base64",
		})
		expect(result).toEqual({
			"file1.txt": "Y29udGVudDE=",
			"file2.js": "Y29udGVudDI=",
			"node_modules/file3.js": "Y29udGVudDM=",
		})
	})

	it("should exclude negated matchers", async () => {
		const result = await toJson({ fs, matchers: ["**/*", "!**/node_modules/*"], resolveFrom: "/" })
		expect(result).toEqual({
			"file1.txt": "content1",
			"file2.js": "content2",
		})
	})

	it("should match be able to only match specific file endings", async () => {
		const result = await toJson({ fs, matchers: ["**/*.js"], resolveFrom: "/" })
		expect(result).toEqual({
			"file2.js": "content2",
			"node_modules/file3.js": "content3",
		})
	})
})
