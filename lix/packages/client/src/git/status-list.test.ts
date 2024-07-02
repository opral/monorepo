import { describe, it, expect, vi } from "vitest"
// @ts-ignore
import { openRepository } from "../index.ts"
// @ts-ignore -- ts import not working correctly, TODO: find out why
import { createNodeishMemoryFs, fromSnapshot, toSnapshot } from "@lix-js/fs"

/* eslint-disable no-restricted-imports */
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
// import { status } from "isomorphic-git"
// import { writeFileSync } from "node:fs"

describe(
	"status api tests",
	async () => {
		async function doTest({ useLazy }: { useLazy: boolean }) {
			const fs = createNodeishMemoryFs()

			const snapshot = JSON.parse(
				readFileSync(resolve(__dirname, "../../mocks/ci-test-repo.json"), { encoding: "utf-8" })
			)
			fromSnapshot(fs, snapshot)

			const repository: Awaited<ReturnType<typeof openRepository>> = await openRepository(
				"https://github.com/inlang/ci-test-repo",
				{
					nodeishFs: fs,
					ref: "test-symlink",
					debug: false,
					experimentalFeatures: {
						lixCommit: true,
						lazyClone: useLazy,
					},
				}
			)
			await repository.nodeishFs.writeFile("./.env", "i am ignored!")

			if (useLazy) {
				await repository._emptyWorkdir()
				await repository._checkOutPlaceholders()

				expect(
					(await repository.statusList({ includeStatus: ["materialized", "ignored"] })).filter(
						([name]) => !name.startsWith(".git/")
					)
				).toStrictEqual([
					[
						".gitignore",
						"unmodified",
						{
							headOid: "6635cf5542756197081eedaa1ec3a7c2c5a0b537",
							stageOid: "6635cf5542756197081eedaa1ec3a7c2c5a0b537",
							workdirOid: "6635cf5542756197081eedaa1ec3a7c2c5a0b537",
						},
					],
					[
						".git",
						"ignored",
						{
							headOid: undefined,
							stageOid: undefined,
							workdirOid: "ignored",
						},
					],
					[
						".env",
						"ignored",
						{
							headOid: undefined,
							stageOid: undefined,
							workdirOid: "ignored",
						},
					],
				])
			}

			// it("standard workflow statuses are correct", async () => {
			// to create a new base snapshot:

			// const snapshot = {}
			// writeFileSync(
			// 	"./mocks/ci-test-repo.json",
			// 	JSON.stringify(toSnapshot(repository.nodeishFs), undefined, 4)
			// )

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

			expect(await repository.statusList()).toStrictEqual([
				[
					"README.md",
					"*modified",
					{
						headOid: "aa6fb2c3d7b34969ffc630276e586e8a42382d50",
						stageOid: "aa6fb2c3d7b34969ffc630276e586e8a42382d50",
						workdirOid: "20aaabed6743b8b267d9a2caf7aa56486058e057",
					},
				],
				[
					"folder/README_newfile.md",
					"*untracked",
					{
						headOid: undefined,
						stageOid: undefined,
						workdirOid: "42", // TODO we could utilize addHash parameter as well here "20aaabed6743b8b267d9a2caf7aa56486058e057",
					},
				],
			])

			await repository._add("README.md")
			await repository._add("folder/README_newfile.md")

			expect(await repository.statusList()).toStrictEqual([
				[
					"README.md",
					"modified",
					{
						headOid: "aa6fb2c3d7b34969ffc630276e586e8a42382d50",
						stageOid: "20aaabed6743b8b267d9a2caf7aa56486058e057",
						workdirOid: "20aaabed6743b8b267d9a2caf7aa56486058e057",
					},
				],
				[
					"folder/README_newfile.md",
					"added",
					{
						headOid: undefined,
						stageOid: "20aaabed6743b8b267d9a2caf7aa56486058e057",
						workdirOid: "20aaabed6743b8b267d9a2caf7aa56486058e057",
					},
				],
			])

			await repository.commit({
				author: { name: "tests", email: "test@inlang.dev" },
				include: ["README.md", "folder/README_newfile.md"],
				message: "test changes commit",
			})

			expect(await repository.statusList()).toStrictEqual([])

			await repository.nodeishFs.writeFile(".gitignore", ``)

			const statusWithoutGitFolder = (
				await repository.statusList({ includeStatus: ["ignored"] })
			).filter(([name]) => {
				return !name.startsWith(".git/")
			})

			expect(statusWithoutGitFolder).toStrictEqual([
				[
					".env",
					"*untracked",
					{
						headOid: undefined,
						stageOid: undefined,
						workdirOid: "42",
					},
				],
				[
					".gitignore",
					"*modified",
					{
						headOid: "6635cf5542756197081eedaa1ec3a7c2c5a0b537",
						stageOid: "6635cf5542756197081eedaa1ec3a7c2c5a0b537",
						workdirOid: "e69de29bb2d1d6434b8b29ae775ad8c2e48c5391",
					},
				],
				[
					".git",
					"ignored",
					{
						headOid: undefined,
						stageOid: undefined,
						workdirOid: "ignored",
					},
				],
			])

			const statusResults = await repository.statusList({ includeStatus: ["unmodified"] })
			expect(statusResults.filter(([, status]) => status !== "unmodified").length).toBe(2)
			expect(statusResults.filter(([, status]) => status === "unmodified").length).toBe(42)

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
			await repository.commit({
				include: ["README.md", ".gitignore"],
				author: { name: "tests", email: "test@inlang.dev" },
				message: "test changes commit",
			})
			// })

			// it("*deleted and deleted status", async () => {
			await repository.nodeishFs.readFile("./svelte.config.js")
			await repository.nodeishFs.rm("./svelte.config.js")

			expect(await repository.statusList()).toStrictEqual([
				[
					".env",
					"*untracked",
					{
						headOid: undefined,
						stageOid: undefined,
						workdirOid: "42",
					},
				],
				[
					"svelte.config.js",
					"*deleted",
					{
						headOid: "1cf26a00dfea4c302bcf647a274bc40840264000",
						stageOid: "1cf26a00dfea4c302bcf647a274bc40840264000",
						workdirOid: undefined,
					},
				],
			])

			await repository._remove("svelte.config.js")
			await repository._add(".env")

			expect(await repository.statusList()).toStrictEqual([
				[
					".env",
					"added",
					{
						headOid: undefined,
						stageOid: "74756744f2149fafa1c98e40981bb081a4e53392",
						workdirOid: "74756744f2149fafa1c98e40981bb081a4e53392",
					},
				],
				[
					"svelte.config.js",
					"deleted",
					{
						headOid: "1cf26a00dfea4c302bcf647a274bc40840264000",
						stageOid: undefined,
						workdirOid: undefined,
					},
				],
			])

			await repository.commit({
				include: [],
				author: { name: "tests", email: "test@inlang.dev" },
				message: "test changes commit",
			})

			expect(await repository.statusList()).toStrictEqual([])
			// })

			// you cannot undelete by restoring a placeholder, undeletion will always happen with a materialized file
			await repository.nodeishFs.readFile("./postcss.config.js", {
				encoding: "utf-8",
			})

			// // "*undeleted"	file was deleted from stage, but is still in the working dir
			// it("*undeleted status", async () => {
			await repository._remove("postcss.config.js")

			expect(await repository.statusList({ filepaths: ["postcss.config.js"] })).toStrictEqual([
				[
					"postcss.config.js",
					"*undeleted",
					{
						headOid: "0f7721681d725ddea512a5ed734891cf6545ca3c",
						stageOid: undefined,
						workdirOid: "0f7721681d725ddea512a5ed734891cf6545ca3c",
					},
				],
			])

			await repository.commit({
				include: [],
				author: { name: "tests", email: "test@inlang.dev" },
				message: "test changes commit",
			})

			expect(await repository.statusList()).toStrictEqual([
				[
					"postcss.config.js",
					"*untracked",
					{
						headOid: undefined,
						stageOid: undefined,
						workdirOid: "42",
					},
				],
			])

			await repository.nodeishFs.rm("./postcss.config.js")

			expect(await repository.statusList()).toStrictEqual([])
			// })

			// "*unmodified" working dir and HEAD commit match, but stage differs
			// it("*unmodified status", async () => {
			const fileContent1 = await repository.nodeishFs.readFile("./README.md", {
				encoding: "utf-8",
			})

			await repository.nodeishFs.writeFile("./README.md", fileContent1 + "\n// foo")

			await repository._add("README.md")

			await repository.nodeishFs.writeFile("./README.md", fileContent1)

			expect(await repository.statusList()).toStrictEqual([
				[
					"README.md",
					"*unmodified",
					{
						headOid: "576143aaea741dafbd9bafb2587a8a6bdb157c29",
						stageOid: "51d0e786e1c788f604a22ab361e11d934d7cccaa",
						workdirOid: "576143aaea741dafbd9bafb2587a8a6bdb157c29",
					},
				],
			])

			// as we dont have staging concept in lix a commit will override the staging if no options are given.
			await repository.commit({
				include: ["README.md"],
				author: { name: "tests", email: "test@inlang.dev" },
				message: "test changes commit",
			})

			expect(await repository.statusList()).toStrictEqual([])
			// })

			// // "*undeletemodified"	file was deleted from stage, but is present with modifications in the working dir
			// it("*undeletemodified status", async () => {
			const fileContent2 = await repository.nodeishFs.readFile("./README.md", {
				encoding: "utf-8",
			})

			await repository._remove("README.md")

			await repository.nodeishFs.writeFile("./README.md", fileContent2 + "\n// foo")

			expect(await repository.statusList()).toStrictEqual([
				[
					"README.md",
					"*undeletemodified",
					{
						headOid: "576143aaea741dafbd9bafb2587a8a6bdb157c29",
						stageOid: undefined,
						workdirOid: "51d0e786e1c788f604a22ab361e11d934d7cccaa",
					},
				],
			])

			await repository.commit({
				include: ["README.md"],
				author: { name: "tests", email: "test@inlang.dev" },
				message: "test changes commit",
			})

			expect(await repository.statusList()).toStrictEqual([])
			// })

			// // "*absent"	file not present in working dir or HEAD commit, but present in stage
			// it("*absent status", async () => {
			const fileContent3 = await repository.nodeishFs.readFile("./vite.config.ts", {
				encoding: "utf-8",
			})

			await repository.nodeishFs.rm("./vite.config.ts")

			await repository.commit({
				include: ["vite.config.ts"],
				author: { name: "tests", email: "test@inlang.dev" },
				message: "test changes commit",
			})

			await repository.nodeishFs.writeFile("./vite.config.ts", fileContent3)

			await repository._add("vite.config.ts")

			await repository.nodeishFs.rm("./vite.config.ts")

			expect(await repository.statusList()).toStrictEqual([
				[
					"vite.config.ts",
					"*absent",
					{
						headOid: undefined,
						stageOid: "c9cd2ba360ae1b1962414d910f9a8cdbd46edb9d",
						workdirOid: undefined,
					},
				],
			])

			await repository.commit({
				include: ["vite.config.ts"],
				author: { name: "tests", email: "test@inlang.dev" },
				message: "test changes commit",
			})

			expect(await repository.statusList()).toStrictEqual([])
			// })
			// expect(await repository.statusList({ includeStatus: ["materialized"] })).toStrictEqual([])

			const linkB = await repository.nodeishFs.readlink("./test-symlink")
			const linkA = await repository.nodeishFs.readlink("./test-symlink-not-existing-target")

			expect(linkB).toBe("/test-symlink//.././static")
			expect(linkA).toBe("/test-symlink-not-existing-target//.././no-exist")

			return toSnapshot(repository.nodeishFs)
		}

		it("lazy repo is identical to eager repo", async () => {
			vi.useFakeTimers()
			const snapA = await doTest({ useLazy: true })
			const snapB = await doTest({ useLazy: false })

			// normalize snapshots a bit
			for (const [, stat] of Object.entries(snapA.fsStats)) {
				// @ts-ignore
				if (!stat.symlinkTarget) {
					// @ts-ignore
					delete stat.symlinkTarget
				}
				// @ts-ignore
				stat._oid = "ignored"
				// @ts-ignore
				stat._rootHash = "ignored"
				// @ts-ignore
				stat.mtimeMs = -1
				// @ts-ignore
				stat.ctimeMs = -1
			}
			for (const [path, content] of Object.entries(snapA.fsMap)) {
				// @ts-ignore
				if (content.placeholder && typeof snapB.fsMap[path] === "string") {
					snapB.fsMap[path] = { placeholder: true }
				}
				// delete the known extra packfiles in lazy snapshot
				if (path.startsWith("/.git/objects/pack/")) {
					for (const packFile of [
						"/.git/objects/pack/pack-02be53df793edd50f0fc133384db246495491658",
						"/.git/objects/pack/pack-18fd350c176426a096636f821abddb9998d04d0b",
						"/.git/objects/pack/pack-19f977d5eaefc2553ad17e1faaf1bdf35feebf0d",
						"/.git/objects/pack/pack-8323a3d068cb7bf606cccc1574ef2be32391a2bc",
						"/.git/objects/pack/pack-8c4f18c048db5e7b7075c263a73c808c2bc95336",
						"/.git/objects/pack/pack-a51df86e4b8a006e9131a6f053a0e07adc0ea487",
					]) {
						if (path.startsWith(packFile)) {
							delete snapA.fsMap[path]
						}
					}
				}
			}
			for (const [, stat] of Object.entries(snapB.fsStats)) {
				// @ts-ignore
				if (!stat.symlinkTarget) {
					// @ts-ignore
					delete stat.symlinkTarget
				}
				// @ts-ignore
				stat._oid = "ignored"
				// @ts-ignore
				stat._rootHash = "ignored"
				// @ts-ignore
				stat.mtimeMs = -1
				// @ts-ignore
				stat.ctimeMs = -1
			}

			delete snapA.fsMap["/.git/index/"]
			delete snapA.fsMap["/.git/objects/pack/"]
			delete snapB.fsMap["/.git/objects/pack/"]
			delete snapB.fsMap["/.git/index/"]

			expect(snapA.fsMap).toStrictEqual(snapB.fsMap)
			expect(snapA.fsStats).toStrictEqual(snapB.fsStats)
			vi.useRealTimers()
		})
	},
	{ timeout: 7000 }
)
