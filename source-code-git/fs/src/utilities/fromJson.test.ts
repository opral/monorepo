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
			"file1.txt": "Y29udGVudDE=",
			"file2.js": "Y29udGVudDI=",
			"node_modules/file3.js": "Y29udGVudDM=",
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

it("should be able to make a binary roundtrip", async () => {
	const fs = createMemoryFs()
	await fromJson({
		fs,
		resolveFrom: "/",
		json: {
			"file1.txt": "Y29udGVudDE=",
			"file2.gif": "R0lGODlhAQABAIAAAP///////yH5BAAAAAAALAAAAAABAAEAAAIBAAA=",
			"images/file3.png":
				"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABAQAAAAA3bvkkAAAAEElEQVR4nGJgAQAAAP//AwAABgAFV7+r1AAAAABJRU5ErkJggg==",
		},
	})

	const json = await toJson({ fs, matchers: ["**/*"], resolveFrom: "/" })
	const fs2 = createMemoryFs()
	await fromJson({ fs: fs2, resolveFrom: "/", json })
	expect(await fs.readFile("/file1.txt", { encoding: "utf-8" })).toEqual(
		await fs2.readFile("/file1.txt", { encoding: "utf-8" }),
	)
	expect(await fs.readFile("/file2.gif", { encoding: "binary" })).toEqual(
		await fs2.readFile("/file2.gif", { encoding: "binary" }),
	)
	expect(await fs.readFile("images/file3.png", { encoding: "binary" })).toEqual(
		await fs2.readFile("images/file3.png", { encoding: "binary" }),
	)
})

// toJson and fromJson should encode and decode utf-8
// this test is a response to https://github.com/inlang/inlang/issues/811
it("should work with characters outside of latin1", async () => {
	const fs = createMemoryFs()
	await fs.writeFile("/file4.txt", "👨‍👩‍👧")
	const json = await toJson({ fs, matchers: ["**/*"], resolveFrom: "/" })
	await fromJson({
		fs,
		resolveFrom: "/",
		json,
	})
	expect(await fs.readFile("/file4.txt", { encoding: "utf-8" })).toEqual("👨‍👩‍👧")
})
