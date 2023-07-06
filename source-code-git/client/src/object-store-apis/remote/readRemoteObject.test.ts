import { it, expect, describe } from "vitest"
import { fetchPackedObject, demuxPackfile } from "./readRemoteObject.js"
import fs from "node:fs/promises"

// 65d5954c10b79c2053c440586255ab5aaafd136a - bigtree
// ceeca803bd2d28347a46cf1ee967bb66ae56c117 - root tree
describe("git remote", () => {
	it("read packfile", async () => {
		const packedObj = await fetchPackedObject(
			"ceeca803bd2d28347a46cf1ee967bb66ae56c117",
			"https://github.com/araknast/AppFlowy"
		) 

		expect(packedObj).toBeDefined()
		if (!packedObj) return

		const pack = demuxPackfile(packedObj)
		fs.writeFile("./onetree2", pack)
	})
})
