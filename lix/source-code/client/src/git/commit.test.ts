import { describe, it, expect, vi } from "vitest"
import { openRepository } from "../index.ts"
import { createNodeishMemoryFs, toSnapshot, fromSnapshot } from "@lix-js/fs"
import { readFileSync } from "node:fs"
// import { writeFileSync } from "node:fs"

describe("main workflow", async () => {
	async function testCommit({ useCustomCommit }) {
		const fs = createNodeishMemoryFs()

		const snapshot = JSON.parse(readFileSync("./mocks/ci-test-repo.json", { encoding: "utf-8" }))
		fromSnapshot(fs, snapshot)

		const repository: Awaited<ReturnType<typeof openRepository>> = await openRepository(
			"https://github.com/inlang/ci-test-repo",
			{
				nodeishFs: fs,
				branch: "test-symlink",
			}
		)

		// to create a new base snapshot:

		// const snapshot = {}
		// writeFileSync(
		// 	"./mocks/ci-test-repo.json",
		// 	JSON.stringify(toSnapshot(repository.nodeishFs), undefined, 4)
		// )

		const commitFun = useCustomCommit ? repository.commit : repository._isoGit.commit

		let fileContent = ""
		fileContent = await repository.nodeishFs.readFile("./README.md", {
			encoding: "utf-8",
		})

		fileContent += "\n// foo"
		await repository.nodeishFs.writeFile("./README.md", fileContent)
		await repository.nodeishFs.mkdir("./folder")
		await repository.nodeishFs.writeFile("./folder/README_newfile.md", fileContent)
		const statusPre = await repository.status({ filepath: "README.md" })

		expect(statusPre).toBe("*modified")

		await repository.add({ filepath: "README.md" })
		await repository.add({ filepath: "folder/README_newfile.md" })
		await commitFun({
			fs,
			dir: "/",
			author: { name: "tests", email: "test@inlang.dev" },
			message: "test changes commit",
		})

		const statusPost = await repository.status({ filepath: "README.md" })
		const statusPost2 = await repository.status({ filepath: "folder/README_newfile.md" })

		expect(statusPost).toBe("unmodified")
		expect(statusPost2).toBe("unmodified")

		const statusPost3 = await repository.status({ filepath: "test-symlink-not-existing-target" })
		const statusPost4 = await repository.status({ filepath: "test-symlink" })
		// const statusPost5 = await repository.status({ filepath: "test-submodule" }) not supported yet

		expect(statusPost3).toBe("unmodified")
		expect(statusPost4).toBe("unmodified")
		// expect(statusPost5).toBe("unmodified")

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
		const snapA = await testCommit({ useCustomCommit: true })

		const snapB = await testCommit({ useCustomCommit: false })

		expect(snapA).toStrictEqual(snapB)
		vi.useRealTimers()
	})

	// TODO: add loose checkout test when implemented in openRepo it("can commit loose file checkout same as full checkout", async () => {
	// })
})
