import { it, expect, describe } from "vitest"
import { raw, http } from "@inlang-git/client/raw"
import { createMemoryFs } from "@inlang-git/fs"
import { createObjectStoreFs } from "./objectStoreFs.js"
import createMappedObjectStore from "./createMappedObjectStore.js"

describe("git fs", async () => {
	const fs = createMemoryFs()
	const dir = "/"
	await raw.init({ fs, dir })
	await raw.addRemote({
		fs,
		dir,
		remote: "origin",
		url: "https://github.com/araknast/AppFlowy",
	})

	await raw.fetch({
		fs,
		http,
		dir: "/",
		remote: "origin",
		singleBranch: true,
		depth: 1,
	})

	const main = await raw.resolveRef({
		fs,
		dir,
		ref: "origin/main",
		depth: 1,
	})

	const objectStore = await createMappedObjectStore(main, `${dir}/.git`, fs)
	const gitFs = await createObjectStoreFs(objectStore)

	const readWrite = async (path: string, content: string) => {
		const fsRoot = gitFs.getRootOid()
		const dirents = await gitFs.readdir(`${path}/..`).catch((e) => {
			if (e.code === "ENOENT") return []
			else throw e
		})

		await expect(
			async () =>
				await gitFs.readFile(path, {
					encoding: "utf-8",
				}),
		).rejects.toThrow(/ENOENT/)

		await gitFs.writeFile(path, content)

		expect(
			await gitFs.readFile(path, {
				encoding: "utf-8",
			}),
		).toBe(content)

		// Make sure hash changes propogated up the entire branch
		expect(gitFs.getRootOid()).not.toEqual(fsRoot)

		// Make sure existing directory contents are still there
		const newDirents = await gitFs.readdir(`${path}/..`)
		for (const dirent of dirents) {
			expect(newDirents).toContain(dirent)
		}
	}

	const mkdir = async (path: string) => {
		const fsRoot = gitFs.getRootOid()
		const dirents = await gitFs.readdir(`${path}/..`).catch((e) => {
			if (e.code === "ENOENT") return []
			else throw e
		})

		await expect(async () => await gitFs.readdir(path)).rejects.toThrow(/ENOENT/)

		await gitFs.mkdir(path)

		expect(await gitFs.readdir(path)).toEqual([])

		expect(gitFs.getRootOid()).not.toEqual(fsRoot)

		const newDirents = await gitFs.readdir(`${path}/..`)
		for (const dirent of dirents) {
			expect(newDirents).toContain(dirent)
		}

		// Make sure the directory can be properly written to and read from
		await readWrite(`${path}/file.txt`, "test file content")
	}

	describe.shuffle("read and write", () => {
		it("file at the beginning of an existing tree", () =>
			readWrite("./frontend/appflowy_flutter/assets/translations/!!.json", "test file content!"))

		it("directory at the beginning of an existing tree", () =>
			mkdir("./frontend/appflowy_flutter/assets/translations/!!!"))

		it("file at the end of an existing tree", () =>
			readWrite("./frontend/appflowy_flutter/assets/translations/~~.json", "test file content!"))

		it("directory at the end of an existing tree", () =>
			mkdir("./frontend/appflowy_flutter/assets/translations/~~~"))

		it("file with unicode to an existing tree", () =>
			readWrite("./frontend/appflowy_flutter/assets/translations/😃.json", "😃😃😃😃😃😃wow!"))

		it("directory with unicode to an existing tree", () =>
			mkdir("./frontend/appflowy_flutter/assets/translations/😃"))

		it("file to one new tree", () =>
			readWrite("./frontend/appflowy_flutter/assets/translations2/😃.json", "test file content!"))

		it("directory to one new tree", () =>
			mkdir("./frontend/appflowy_flutter/assets/translations2_/😃"))

		it("file to multiple new trees", () =>
			readWrite("./frontend/new/folder/file.txt", "test file content!"))

		it("directory to multiple new trees", () => mkdir("./frontend/new_/folder_/directory"))

		it("file to multiple new trees at the root", () =>
			readWrite("./brand/new/folder/file.txt", "test file content!"))

		it("directory to multiple new trees at the root", () =>
			mkdir("./brand_/new_/folder_/directory"))
	})
})
