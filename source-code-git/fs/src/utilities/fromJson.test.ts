import { it, expect, describe, afterAll } from "vitest"
import { fromJson } from "./fromJson.js"
import { toJson } from "./toJson.js"
import { filesystems } from "../test/filesystems.js"

for (const [name, fs] of Object.entries(filesystems)) {
	describe(name, async () => {
		const rootTempDir = new URL("./__test_fromJson", import.meta.url).pathname

		afterAll(async () => {
			await fs.rmdir(rootTempDir)
		})

		it("should be able to import files from JSON", async () => {
			const tempDir = rootTempDir + "/import"
			await fs.mkdir(tempDir, { recursive: true })

			await fromJson({
				fs,
				resolveFrom: tempDir,
				json: {
					"file1.txt": "Y29udGVudDE=",
					"file2.js": "Y29udGVudDI=",
					"node_modules/file3.js": "Y29udGVudDM=",
				},
			})
			expect(await fs.readFile(tempDir + "/file1.txt", { encoding: "utf-8" })).toEqual("content1")
			expect(await fs.readFile(tempDir + "/file2.js", { encoding: "utf-8" })).toEqual("content2")
			expect(await fs.readFile(tempDir + "/node_modules/file3.js", { encoding: "utf-8" })).toEqual(
				"content3",
			)
		})

		it("should be able to make a roundtrip", async () => {
			const tempDir = rootTempDir + "/roundtrip"
			const tempDir2 = rootTempDir + "/roundtrip2"

			await fs.mkdir(tempDir, { recursive: true })

			await fromJson({
				fs,
				resolveFrom: tempDir,
				json: {
					"file1.txt": "Y29udGVudDE=",
					"file2.js": "Y29udGVudDI=",
					"node_modules/file3.js": "Y29udGVudDM=",
				},
			})
			const json = await toJson({ fs, matchers: ["**/*"], resolveFrom: "/" })
			await fromJson({ fs, resolveFrom: tempDir2, json })
			expect(await fs.readFile(tempDir + "/file1.txt", { encoding: "utf-8" })).toEqual(
				await fs.readFile(tempDir2 + "/file1.txt", { encoding: "utf-8" }),
			)
			expect(await fs.readFile(tempDir + "/file2.js", { encoding: "utf-8" })).toEqual(
				await fs.readFile(tempDir2 + "/file2.js", { encoding: "utf-8" }),
			)
			expect(await fs.readFile(tempDir + "/node_modules/file3.js", { encoding: "utf-8" })).toEqual(
				await fs.readFile(tempDir2 + "/node_modules/file3.js", { encoding: "utf-8" }),
			)
		})

		it("should be able to make a binary roundtrip", async () => {
			const tempDir = rootTempDir + "/roundtrip-binary"
			const tempDir2 = rootTempDir + "/roundtrip-binary2"

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

			const json = await toJson({ fs, matchers: ["**/*"], resolveFrom: tempDir })
			await fromJson({ fs: fs, resolveFrom: tempDir2, json })
			expect(await fs.readFile(tempDir + "/file1.txt", { encoding: "utf-8" })).toEqual(
				await fs.readFile(tempDir2 + "/file1.txt", { encoding: "utf-8" }),
			)
			expect(await fs.readFile(tempDir + "/file2.gif", { encoding: "binary" })).toEqual(
				await fs.readFile(tempDir2 + "/file2.gif", { encoding: "binary" }),
			)
			expect(await fs.readFile(tempDir + "/images/file3.png", { encoding: "binary" })).toEqual(
				await fs.readFile(tempDir2 + "/images/file3.png", { encoding: "binary" }),
			)
		})
	})
}
