import { describe, bench } from "vitest"
import { openRepository, createNodeishMemoryFs } from "./index.js"

describe("main workflow", () => {
	let repository: Awaited<ReturnType<typeof openRepository>>
	bench(
		"opens a repo url without error and without blocking i",
		async () => {
			repository = await openRepository("github.com/inlang/example.git", {
				nodeishFs: createNodeishMemoryFs(),
			})
		},
		{ time: 50 },
	)

	let file
	bench(
		"file is lazy fetched upon first access",
		async () => {
			file = await repository.nodeishFs.readFile("./inlang.config.js", { encoding: "utf-8" })
		},
		{ time: 100 },
	)
})
