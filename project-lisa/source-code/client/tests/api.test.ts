import { describe, it, expect, beforeAll, bench } from "vitest"
import { open, createNodeishMemoryFs } from "../src/index.js"

// -- loading multiple repositories is possible
// -- (FUTURE) loading a local repository is possible
// const localRepository = await load("/home/foo/bar.git", { fs: nodeFs })
// -- loading a remote repository is possible
// - uses lisa.dev which acts as a proxy to github.com. Legacy git hosts don't support
// all features we need like lazy fetching, auth, etc.

describe("main workflow", () => {
	let repository
	it("opens a repo url without error and without blocking io", async () => {
		repository = open("github.com/inlang/example.git", {
			nodeishFs: createNodeishMemoryFs(),
		})
	})

	let file
	it("file is lazy fetched upon first access", async () => {
		file = await repository.nodeishFs.readFile("./inlang.config.js", { encoding: "utf-8" })
	})

	it("modifying the file", async () => {
		file += "\n// bar"
		await repository.nodeishFs.writeFile("./inlang.config.js", file)
	})

	it("can commit local modifications to the repo", async () => {
		// TODO: implement status api
		const statusPre = await repository.status({ filepath: "inlang.config.js" })

		expect(statusPre).toBe('*modified')

		await repository.add({ filepath:"inlang.config.js" })
		await repository.commit({ author: { name: "tests", email: "test@inlang.dev" }, message: "test changes commit" })

		const statusPost = await repository.status({ filepath: "inlang.config.js" })

		expect(statusPost).toBe('unmodified')
	})

	// await repository.push()
})
