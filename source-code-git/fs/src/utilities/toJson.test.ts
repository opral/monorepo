import { it, describe, expect } from "vitest"
import { createMemoryFs } from "../implementations/memoryFs.js"
import { toJson } from "./toJson.js"
import { fromJson } from "./fromJson.js"

describe("toJson", async () => {
	const fs = createMemoryFs()
	await fs.writeFile("/file1.txt", "content1")
	await fs.writeFile("/file2.js", "content2")
	await fs.mkdir("/node_modules")
	await fs.writeFile("/node_modules/file3.js", "content3")

	// required to align with the fromJson function.
	it("should not prefix the path with a slash", async () => {
		const result = await toJson({
			fs,
			matchers: ["**/*"],
			resolveFrom: "/",
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
			"file1.txt": "Y29udGVudDE=",
			"file2.js": "Y29udGVudDI=",
		})
	})

	it("should match be able to only match specific file endings", async () => {
		const result = await toJson({ fs, matchers: ["**/*.js"], resolveFrom: "/" })
		expect(result).toEqual({
			"file2.js": "Y29udGVudDI=",
			"node_modules/file3.js": "Y29udGVudDM=",
		})
	})

	// toJson and fromJson should encode and decode utf-8
	// this test is a response to https://github.com/inlang/inlang/issues/811
	it("should work with characters outside of latin1", async () => {
		const fs = createMemoryFs()
		fs.writeFile("/file1.txt", "👋")
		const json = await toJson({ fs, matchers: ["**/*"], resolveFrom: "/" })
		const fs2 = createMemoryFs()
		await fromJson({ fs: fs2, json, resolveFrom: "/" })
		expect(await fs2.readFile("/file1.txt", { encoding: "utf-8" })).toEqual("👋")
	})
})
