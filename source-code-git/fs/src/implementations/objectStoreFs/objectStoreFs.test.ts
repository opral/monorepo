import { it, expect, describe } from "vitest"
import { raw, http } from "@inlang-git/client/raw"
import { createObjectStoreFs } from "./objectStoreFs.js"
import { createMemoryFs } from "../memoryFs.js"

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

	const gitFs = await createObjectStoreFs(fs, `${dir}/.git`, main)

	const readWrite = async (path: string, content: string) => {
		const fsRoot = gitFs.getRoot()
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
		expect(gitFs.getRoot()).not.toEqual(fsRoot)

		const newDirents = await gitFs.readdir(`${path}/..`)
		for (const dirent of dirents) {
			expect(newDirents).toContain(dirent)
		}
	}

	describe.shuffle("read and write files", () => {
		it("at the beginning of an existing tree", () =>
			readWrite("./frontend/appflowy_flutter/assets/translations/!!.json", "test file content!"))

		it("at the end of an existing tree", () =>
			readWrite("./frontend/appflowy_flutter/assets/translations/~~.json", "test file content!"))

		it("unicode to an existing tree", () =>
			readWrite("./frontend/appflowy_flutter/assets/translations/😃.json", "😃😃😃😃😃😃wow!"))

		it("to one new tree", () =>
			readWrite("./frontend/appflowy_flutter/assets/translations2/😃.json", "test file content!"))

		it("to multiple new trees", () =>
			readWrite("./frontend/new/folder/file.txt", "test file content!"))

		it("to multiple new trees at the root", () =>
			readWrite("./brand/new/folder/file.txt", "test file content!"))
	})
})
