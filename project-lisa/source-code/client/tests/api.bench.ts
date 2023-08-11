import { describe, it, bench } from "vitest"
import { open, createNodeishMemoryFs } from "../src/index.js"

describe("main workflow", () => {
	let repository
	it("opens a repo url without error and without blocking io", async () => {
		bench('normal sorting', () => {
			repository = open("github.com/inlang/example.git", {
				nodeishFs: createNodeishMemoryFs(),
			})
		}, { time: 100 })
	})

	let file
	it("file is lazy fetched upon first access", async () => {
    bench('normal sorting', async () => {
		  file = await repository.nodeishFs.readFile("./inlang.config.js", { encoding: "utf-8" })
    })
	})
})
