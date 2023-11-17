import { describe, it, expect, vi } from "vitest"
import { openRepository, createNodeishMemoryFs } from "../index.js"

describe("main workflow", () => {
	let repository: Awaited<ReturnType<typeof openRepository>>

	it("allows to subscribe to errors", async () => {
		const errorHandler = vi.fn()
		repository = await openRepository("https://github.com/inlang/examplX", {
			nodeishFs: createNodeishMemoryFs(),
		})

		repository.errors.subscribe(errorHandler)

		await new Promise((resolve) => setTimeout(resolve, 1000))

		expect(errorHandler.mock.calls.length).toBe(1)
		expect(errorHandler.mock.calls[0][0][0].code).toBe("HttpError")
	})

	it("opens a repo url without error and without blocking io", async () => {
		// fix normalization of .git
		repository = await openRepository("https://github.com/inlang/example", {
			nodeishFs: createNodeishMemoryFs(),
		})
	})

	let fileContent = ""
	it("file is lazy fetched upon first access", async () => {
		fileContent = await repository.nodeishFs.readFile("./project.inlang.json", {
			encoding: "utf-8",
		})
	})

	it("modifying the file", async () => {
		fileContent += "\n// bar"
		await repository.nodeishFs.writeFile("./project.inlang.json", fileContent)
	})

	it("can commit local modifications to the repo", async () => {
		const statusPre = await repository.status({ filepath: "project.inlang.json" })

		expect(statusPre).toBe("*modified")

		await repository.add({ filepath: "project.inlang.json" })
		await repository.commit({
			author: { name: "tests", email: "test@inlang.dev" },
			message: "test changes commit",
		})

		const statusPost = await repository.status({ filepath: "project.inlang.json" })

		expect(statusPost).toBe("unmodified")
	})
})
