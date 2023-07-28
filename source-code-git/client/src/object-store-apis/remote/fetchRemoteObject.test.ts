import { it, expect, describe } from "vitest"
import { fetchRemoteObject } from "./index.js"
import fs from "node:fs/promises"

// 65d5954c10b79c2053c440586255ab5aaafd136a - bigtree
// ceeca803bd2d28347a46cf1ee967bb66ae56c117 - root tree
describe("git remote", () => {
	it("read packfile", async () => {
		const packfile = await fetchRemoteObject(
			"ceeca803bd2d28347a46cf1ee967bb66ae56c117",
			"https://github.com/araknast/AppFlowy",
		)

		expect(packfile).toBeDefined()
		await fs.writeFile("./packfile", packfile.object)
	})
})
