import { describe, it, expect, vi } from "vitest"
import { openRepository, createNodeishMemoryFs } from "./index.js"

// - loading multiple repositories is possible
// - loading a local repository is possible: const localRepository = await load("/bar.git", { fs: nodeFs })
// - loading a remote repository is possible
// - uses lisa.dev which acts as a proxy to github.com. Legacy git hosts don't support
// - all features we need like lazy fetching, auth, etc.

describe("main workflow", () => {
	let repository: Awaited<ReturnType<typeof openRepository>>

	it("allows to subscribe to errors", async () => {
		const errorHandler = vi.fn()
		repository = await openRepository("https://github.com/inlang/does-not-exist", {
			nodeishFs: createNodeishMemoryFs(),
		})

		repository.errors.subscribe(errorHandler)

		await new Promise((resolve) => setTimeout(resolve, 1000))

		expect(errorHandler.mock.calls.length).toBe(1)
		expect(errorHandler.mock.calls[0][0][0].code).toBe("HttpError")
	})

	it("opens a repo url without error and without blocking io", async () => {
		// fix normalization of .git
		repository = await openRepository("https://github.com/inlang/ci-test-repo", {
			nodeishFs: createNodeishMemoryFs(),
		})
	})

	let fileContent = ""
	it("file is lazy fetched upon first access", async () => {
		fileContent = await repository.nodeishFs.readFile("./README.md", {
			encoding: "utf-8",
		})
	})

	it("modifying the file", async () => {
		fileContent += "\n// bar"
		await repository.nodeishFs.writeFile("./README.md", fileContent)
	})

	it("can commit local modifications to the repo", async () => {
		const statusPre = await repository.status({ filepath: "README.md" })

		expect(statusPre).toBe("*modified")

		await repository.add({ filepath: "README.md" })
		await repository.commit({
			author: { name: "tests", email: "test@inlang.dev" },
			message: "test changes commit",
		})

		const statusPost = await repository.status({ filepath: "README.md" })

		expect(statusPost).toBe("unmodified")
	})

	it("exposes proper origin", async () => {
		const gitOrigin = await repository.getOrigin()
		expect(gitOrigin).toBe("github.com/inlang/ci-test-repo.git")
	})

	it("exposes current branch", async () => {
		const branch = await repository.getCurrentBranch()
		expect(branch).toBe("main")
	})

	it("exposes remotes", async () => {
		const remotes = await repository.listRemotes()
		expect(remotes).toEqual([
			{
				remote: "origin",
				url: "https://github.com/inlang/ci-test-repo",
			},
		])
	})

	it("exposes log", async () => {
		// TODO: do we want lazy history?
		const log = await repository.log({ depth: 1 })

		// TODO: migrate to exact object validation when we have the git proxy and can test local frozen repos
		expect(log.length).toBe(1)
		expect(log[0]?.oid).toBeTypeOf("string")
		expect(log[0]?.commit?.message).toBeTypeOf("string")
	})

	it.todo("exposes metadata for repo", async () => {
		// const metadata = await repository.getMeta()
		// expect(metadata).toBe( .... )
	})

	it.todo("allows pushing back to git origin", async () => {
		// await repository.push()
	})
})
