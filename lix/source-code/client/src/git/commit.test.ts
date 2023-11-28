import { describe, it, expect, vi } from "vitest"
import { openRepository } from "../index.ts"
import { createNodeishMemoryFs, toSnapshot, fromSnapshot } from "@lix-js/fs"
import { readFileSync } from "node:fs"
describe("main workflow", async () => {
	const fs = createNodeishMemoryFs()

	const snapshot = JSON.parse(readFileSync("./mocks/example-repo.json", { encoding: "utf-8" }))
	fromSnapshot(fs, snapshot)

	const repository: Awaited<ReturnType<typeof openRepository>> = await openRepository(
		"https://github.com/inlang/example",
		{
			nodeishFs: fs,
		}
	)

	// to create a new base snapshot:
	// writeFileSync("./mocks/example-repo.json", JSON.stringify(toSnapshot(repository.nodeishFs), undefined, 4))

	async function testCommit(commitFun: (arg: any) => void) {
		let fileContent = ""
		fileContent = await repository.nodeishFs.readFile("./README.md", {
			encoding: "utf-8",
		})

		fileContent += "\n// foo"
		await repository.nodeishFs.writeFile("./README.md", fileContent)
		const statusPre = await repository.status({ filepath: "README.md" })

		expect(statusPre).toBe("*modified")

		await repository.add({ filepath: "README.md" })
		await commitFun({
			fs,
			dir: "/",
			author: { name: "tests", email: "test@inlang.dev" },
			message: "test changes commit",
		})

		const statusPost = await repository.status({ filepath: "README.md" })

		expect(statusPost).toBe("unmodified")

		fileContent += "\n// bar"
		await repository.nodeishFs.writeFile("./README.md", fileContent)

		await repository.add({ filepath: "README.md" })
		await commitFun({
			fs,
			dir: "/",
			author: { name: "tests", email: "test@inlang.dev" },
			message: "test changes commit",
		})

		return toSnapshot(repository.nodeishFs)
	}

	it("coustom committed tree is identical to isomorphic git", async () => {
		vi.useFakeTimers()
		const snapA = await testCommit(repository.commit)

		fromSnapshot(fs, snapshot)

		const snapB = await testCommit(repository._isoGit.commit)

		expect(snapA).toStrictEqual(snapB)
		vi.useRealTimers()
	})

	// TODO: add loose checkout test when implemented in openRepo it("can commit loose file checkout same as full checkout", async () => {
	// })
})
