import { describe, it, expect, vi } from "vitest"
import { openRepository } from "../index.ts"
import { createNodeishMemoryFs, toSnapshot, fromSnapshot } from "@lix-js/fs"
import { readFileSync } from "node:fs"
describe("main workflow", async () => {
	const fs = createNodeishMemoryFs()

	const snapshot = JSON.parse(readFileSync("./mocks/example-repo.json", { encoding: "utf-8" }))
	fromSnapshot(fs, snapshot)

	const repository: Awaited<ReturnType<typeof openRepository>> = await openRepository(
		"https://github.com/inlang/ci-test-repo",
		{
			nodeishFs: fs,
			branch: "symlinks-and-submodules",
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

		const statusPost3 = await repository.status({ filepath: "test-symlink-not-existing-targetd" })
		const statusPost4 = await repository.status({ filepath: "test-symlink" })
		const statusPost5 = await repository.status({ filepath: "test-submodule" })

		expect(statusPost3).toBe("unmodified")
		expect(statusPost4).toBe("unmodified")
		expect(statusPost5).toBe("unmodified")

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
