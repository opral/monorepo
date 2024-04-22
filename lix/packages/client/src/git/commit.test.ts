import { describe, it, expect, vi } from "vitest"
import { openRepository } from "../index.ts"
// @ts-ignore -- ts import not working correctly, TODO: find out why
import { createNodeishMemoryFs, toSnapshot, fromSnapshot } from "@lix-js/fs"

/* eslint-disable no-restricted-imports */
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
// import { writeFileSync } from "node:fs"

describe(
	"main workflow",
	async () => {
		async function testCommit({ useCustomCommit }) {
			const fs = createNodeishMemoryFs()

			const snapshot = JSON.parse(
				readFileSync(resolve(__dirname, "../../mocks/ci-test-repo.json"), { encoding: "utf-8" })
			)
			fromSnapshot(fs, snapshot)

			const repository: Awaited<ReturnType<typeof openRepository>> = await openRepository(
				"https://github.com/inlang/ci-test-repo",
				{
					nodeishFs: fs,
					branch: "test-symlink",
					experimentalFeatures: useCustomCommit ? { lixCommit: true } : {},
				}
			)

			// to create a new base snapshot:

			// const snapshot = {}
			// writeFileSync(
			// 	"./mocks/ci-test-repo.json",
			// 	JSON.stringify(toSnapshot(repository.nodeishFs), undefined, 4)
			// )

			const commitFun = useCustomCommit
				? repository.commit
				: async (args) => {
						for (const file of args.include) {
							await repository._add(file)
						}
						return repository._isoCommit({
							author: args.author,
							message: args.message,
						})
				  }

			let fileContent = ""

			fileContent = await repository.nodeishFs.readFile("./README.md", {
				encoding: "utf-8",
			})

			fileContent += "\n// foo"
			await repository.nodeishFs.writeFile("./README.md", fileContent)
			await repository.nodeishFs.mkdir("./folder")
			await repository.nodeishFs.writeFile("./folder/README_newfile.md", fileContent)

			const statusPre = await repository.status("README.md")

			expect(statusPre).toBe("*modified")

			await commitFun({
				author: { name: "tests", email: "test@inlang.dev" },
				include: ["README.md", "folder/README_newfile.md"],
				message: "test changes commit",
			})

			const statusPost = await repository.status("README.md")
			const statusPost2 = await repository.status("folder/README_newfile.md")

			expect(statusPost).toBe("unmodified")
			expect(statusPost2).toBe("unmodified")

			const statusPost3 = await repository.status("test-symlink-not-existing-target")
			expect(statusPost3).toBe("unmodified")

			const statusPost4 = await repository.status("test-symlink")
			expect(statusPost4).toBe("unmodified")

			// const statusPost5 = await repository.status("test-submodule" }) not supported yet
			// expect(statusPost5).toBe("unmodified")

			fileContent += "\n// bar"
			await repository.nodeishFs.writeFile("./README.md", fileContent)

			// check readfile content
			await commitFun({
				include: ["README.md"],
				author: { name: "tests", email: "test@inlang.dev" },
				message: "test delete commit",
			})

			expect(await repository.statusList()).toStrictEqual([])

			await repository.nodeishFs.rm("./README.md")

			if (useCustomCommit) {
				await repository.commit({
					include: ["README.md"],
					author: { name: "tests", email: "test@inlang.dev" },
					message: "test changes commit",
				})
			} else {
				await repository._remove("README.md")

				await repository._isoCommit({
					author: { name: "tests", email: "test@inlang.dev" },
					message: "test changes commit",
				})
			}
			expect(await repository.statusList()).toStrictEqual([])

			return toSnapshot(repository.nodeishFs)
		}

		it("coustom committed tree is identical to isomorphic git", async () => {
			vi.useFakeTimers()
			const snapA = await testCommit({ useCustomCommit: true })

			const snapB = await testCommit({ useCustomCommit: false })

			// reset modtime of git internal file that has bumped modtime for internal reasons
			snapA.fsStats["/.git/index/"].mtimeMs = -1
			snapB.fsStats["/.git/index/"].mtimeMs = -1

			expect(snapA.fsStats).toStrictEqual(snapB.fsStats)
			expect(snapA.fsMap).toStrictEqual(snapB.fsMap)
			vi.useRealTimers()
		})

		// TODO: add loose checkout test when implemented in openRepo it("can commit loose file checkout same as full checkout", async () => {
		// })
	},
	{ timeout: 4000 }
)
