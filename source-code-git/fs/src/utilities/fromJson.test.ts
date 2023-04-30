import { it, expect } from "vitest"
import { createMemoryFs } from "../implementations/memoryFs.js"
import { fromJson } from "./fromJson.js"
import { toJson } from "./toJson.js"

it("should be able to import files from JSON", async () => {
	const fs = createMemoryFs()
	await fromJson({
		fs,
		resolveFrom: "/",
		json: {
			"file1.txt": "Y29udGVudDE=",
			"file2.js": "Y29udGVudDI=",
			"node_modules/file3.js": "Y29udGVudDM=",
		},
	})
	expect(await fs.readFile("/file1.txt", { encoding: "utf-8" })).toEqual("content1")
	expect(await fs.readFile("/file2.js", { encoding: "utf-8" })).toEqual("content2")
	expect(await fs.readFile("/node_modules/file3.js", { encoding: "utf-8" })).toEqual("content3")
})

it("should be able to make a roundtrip", async () => {
	const fs = createMemoryFs()
	await fromJson({
		fs,
		resolveFrom: "/",
		json: {
			"file1.txt": "content1",
			"file2.js": "content2",
			"node_modules/file3.js": "content3",
		},
	})
	const json = await toJson({ fs, matchers: ["**/*"], resolveFrom: "/" })
	const fs2 = createMemoryFs()
	await fromJson({ fs: fs2, resolveFrom: "/", json })
	expect(await fs.readFile("/file1.txt", { encoding: "utf-8" })).toEqual(
		await fs2.readFile("/file1.txt", { encoding: "utf-8" }),
	)
	expect(await fs.readFile("/file2.js", { encoding: "utf-8" })).toEqual(
		await fs2.readFile("/file2.js", { encoding: "utf-8" }),
	)
	expect(await fs.readFile("/node_modules/file3.js", { encoding: "utf-8" })).toEqual(
		await fs2.readFile("/node_modules/file3.js", { encoding: "utf-8" }),
	)
})
