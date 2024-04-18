import { describe, it, expect } from "vitest"
import { openRepository, findRepoRoot } from "./index.ts"
// @ts-ignore -- ts import not working correctly, TODO: find out why
import { createNodeishMemoryFs, fromSnapshot } from "@lix-js/fs"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

// - loading multiple repositories is possible
// - loading a local repository is possible: const localRepository = await load("/bar.git", { fs: nodeFs })
// - loading a remote repository is possible
// - uses lisa.dev which acts as a proxy to github.com. Legacy git hosts don't support
// - all features we need like lazy fetching, auth, etc.

describe("main workflow", () => {
	let repository: Awaited<ReturnType<typeof openRepository>>

	it("should throw errors directly", async () => {
		try {
			repository = await openRepository("https://github.com/inlang/does-not-exist", {
				nodeishFs: createNodeishMemoryFs(),
			})
		} catch (e) {
			expect(e.code).toBe("HttpError")
		}
	})

	it("opens a repo url without error", async () => {
		// fix normalization of .git
		repository = await openRepository("https://github.com/inlang/ci-test-repo", {
			nodeishFs: createNodeishMemoryFs(),
		})
	})

	it("supports local repos", async () => {
		const fs = createNodeishMemoryFs()

		const snapshot = JSON.parse(
			readFileSync(resolve(__dirname, "../mocks/ci-test-repo.json"), { encoding: "utf-8" })
		)
		fromSnapshot(fs, snapshot)

		const repoUrl = await findRepoRoot({
			nodeishFs: fs,
			path: "/src/routes/todo", // should find repo root from any path in the repo
		})

		expect(repoUrl).toBe("file:///")

		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- test fails if repoUrl is null
		const repository: Awaited<ReturnType<typeof openRepository>> = await openRepository(repoUrl!, {
			nodeishFs: fs,
			branch: "test-symlink",
		})

		// test random repo action to make sure opening worked
		const status = await repository.status("README.md")

		expect(status).toBe("unmodified")
	})

	it("supports non root repos", async () => {
		const fs = createNodeishMemoryFs()

		const snapshot = JSON.parse(
			readFileSync(resolve(__dirname, "../mocks/ci-test-repo.json"), { encoding: "utf-8" })
		)
		fromSnapshot(fs, snapshot, { pathPrefix: "/test/toast" })

		const repoUrl = await findRepoRoot({
			nodeishFs: fs,
			path: "/test/toast/src/routes/todo", // should find repo root from any path in the repo
		})

		expect(repoUrl).toBe("file:///test/toast")

		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- test fails if repoUrl is null
		const repository: Awaited<ReturnType<typeof openRepository>> = await openRepository(repoUrl!, {
			nodeishFs: fs,
			branch: "test-symlink",
		})

		// test random repo action to make sure opening worked
		const status = await repository.status("README.md")

		expect(status).toBe("unmodified")
	})

	it("usees the lix custom commit for the whitelistesd ci test repo", () => {
		expect(repository._experimentalFeatures).toStrictEqual({ lixCommit: true, lazyClone: true })
	})

	let fileContent = ""
	it("file is read", async () => {
		fileContent = await repository.nodeishFs.readFile("./README.md", {
			encoding: "utf-8",
		})
	})

	it("modifying the file", async () => {
		fileContent += "\n// bar"
		await repository.nodeishFs.writeFile("./README.md", fileContent)
	})

	it("can commit local modifications to the repo", async () => {
		const statusPre = await repository.status("README.md")

		expect(statusPre).toBe("*modified")

		await repository.commit({
			include: ["README.md"],
			author: { name: "tests", email: "test@inlang.dev" },
			message: "test changes commit",
		})

		const statusPost = await repository.status("README.md")

		expect(statusPost).toBe("unmodified")
	})

	it("can open repo with lazy clone/checkout", async () => {
		const lazyRepo = await openRepository("https://github.com/inlang/ci-test-repo", {
			branch: "test-symlink",
			nodeishFs: createNodeishMemoryFs(),
			experimentalFeatures: { lazyClone: true, lixCommit: true },
		})

		const files = await lazyRepo.nodeishFs.readdir("/")

		expect(files.sort()).toStrictEqual(
			[
				".git",
				".eslintignore",
				".eslintrc.cjs",
				".gitignore",
				".gitmodules",
				".npmrc",
				".prettierignore",
				".prettierrc",
				"README.md",
				"package-lock.json",
				"package.json",
				"postcss.config.js",
				"project.inlang.json",
				"svelte.config.js",
				"tailwind.config.js",
				"test-symlink",
				"test-symlink-not-existing-target",
				"tsconfig.eslint.json",
				"tsconfig.json",
				"vite.config.ts",
				".vscode",
				"project.inlang",
				"resources",
				"src",
				"static",
			].sort()
		)

		const status = await lazyRepo.statusList({
			filepaths: [".npmrc", "README.md"],
			includeStatus: ["materialized"],
		})

		expect(status).toStrictEqual([
			[
				".npmrc",
				"unmodified",
				{
					placeholder: true,
					headOid: "b6f27f135954640c8cc5bfd7b8c9922ca6eb2aad",
					workdirOid: "b6f27f135954640c8cc5bfd7b8c9922ca6eb2aad",
					stageOid: "b6f27f135954640c8cc5bfd7b8c9922ca6eb2aad",
				},
			],
			[
				"README.md",
				"unmodified",
				{
					placeholder: true,
					headOid: "aa6fb2c3d7b34969ffc630276e586e8a42382d50",
					workdirOid: "aa6fb2c3d7b34969ffc630276e586e8a42382d50",
					stageOid: "aa6fb2c3d7b34969ffc630276e586e8a42382d50",
				},
			],
		])

		expect(await lazyRepo.nodeishFs._isPlaceholder("./README.md")).toBe(true)

		const statusPre = await lazyRepo.status("README.md")
		expect(statusPre).toBe("unmodified")

		expect(await lazyRepo.nodeishFs._isPlaceholder("./.npmrc")).toBe(true)
		expect(await lazyRepo.nodeishFs.readFile("./.npmrc", { encoding: "utf-8" })).toBe(
			"engine-strict=true\n"
		)

		expect(await lazyRepo.nodeishFs._isPlaceholder("./README.md")).toBe(true)
		expect(await lazyRepo.nodeishFs._isPlaceholder("./.npmrc")).toBe(false)

		await lazyRepo.nodeishFs.writeFile("./README.md", "test")
		expect(await lazyRepo.nodeishFs.readFile("./README.md", { encoding: "utf-8" })).toBe("test")
		expect(await lazyRepo.nodeishFs._isPlaceholder("./README.md")).toBe(false)

		await lazyRepo.nodeishFs.writeFile("./newfile", "test2")
		expect(await lazyRepo.nodeishFs.readFile("./newfile", { encoding: "utf-8" })).toBe("test2")
		expect(await lazyRepo.nodeishFs._isPlaceholder("./newfile")).toBe(false)

		expect(
			await lazyRepo.statusList({
				includeStatus: ["materialized"],
			})
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
				".npmrc",
				"unmodified",
				{
					headOid: "b6f27f135954640c8cc5bfd7b8c9922ca6eb2aad",
					workdirOid: "b6f27f135954640c8cc5bfd7b8c9922ca6eb2aad",
					stageOid: "b6f27f135954640c8cc5bfd7b8c9922ca6eb2aad",
				},
			],
			[
				"README.md",
				"*modified",
				{
					headOid: "aa6fb2c3d7b34969ffc630276e586e8a42382d50",
					workdirOid: "30d74d258442c7c65512eafab474568dd706c430",
					stageOid: "aa6fb2c3d7b34969ffc630276e586e8a42382d50",
				},
			],
			[
				"newfile",
				"*untracked",
				{
					headOid: undefined,
					stageOid: undefined,
					workdirOid: "42",
				},
			],
		])

		const statusPost = await lazyRepo.status("README.md")
		expect(statusPost).toBe("*modified")

		await lazyRepo.commit({
			author: { name: "tests", email: "test@inlang.dev" },
			message: "test changes commit",
			include: ["README.md"],
		})

		expect(
			await lazyRepo.statusList({
				includeStatus: ["materialized"],
			})
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
				".npmrc",
				"unmodified",
				{
					headOid: "b6f27f135954640c8cc5bfd7b8c9922ca6eb2aad",
					workdirOid: "b6f27f135954640c8cc5bfd7b8c9922ca6eb2aad",
					stageOid: "b6f27f135954640c8cc5bfd7b8c9922ca6eb2aad",
				},
			],
			[
				"README.md",
				"unmodified",
				{
					headOid: "30d74d258442c7c65512eafab474568dd706c430",
					workdirOid: "30d74d258442c7c65512eafab474568dd706c430",
					stageOid: "30d74d258442c7c65512eafab474568dd706c430",
				},
			],
			[
				"newfile",
				"*untracked",
				{
					headOid: undefined,
					stageOid: undefined,
					workdirOid: "42",
				},
			],
		])

		const statusPo = await lazyRepo.status("README.md")

		expect(statusPo).toBe("unmodified")
	})

	it("can commit open repos without origin or git config (the case eg. on render.com or other deoployment scenarios)", async () => {
		const fs = createNodeishMemoryFs()

		const snapshot = JSON.parse(
			readFileSync(resolve(__dirname, "../mocks/ci-test-repo.json"), { encoding: "utf-8" })
		)
		fromSnapshot(fs, snapshot)

		await fs.rm("/.git/config")

		const repoUrl = await findRepoRoot({
			nodeishFs: fs,
			path: "/src/routes/todo", // should find repo root from any path in the repo
		})

		expect(repoUrl).toBe("file:///")

		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- test fails if repoUrl is null
		const repository: Awaited<ReturnType<typeof openRepository>> = await openRepository(repoUrl!, {
			nodeishFs: fs,
			branch: "test-symlink",
		})

		// test random repo action to make sure opening worked
		const status = await repository.status("README.md")

		expect(status).toBe("unmodified")
	})

	it("uses nested gitignore files correctly", async () => {
		const fs = createNodeishMemoryFs()

		const snapshot = JSON.parse(
			readFileSync(resolve(__dirname, "../mocks/ci-test-repo.json"), { encoding: "utf-8" })
		)
		fromSnapshot(fs, snapshot)

		const repo: Awaited<ReturnType<typeof openRepository>> = await openRepository("file:///", {
			nodeishFs: fs,
			experimentalFeatures: { lazyClone: true, lixCommit: true },
			branch: "test-symlink",
		})

		await repo.nodeishFs.writeFile("/static/test1", "file content\n")
		try {
			await repo._emptyWorkdir()
		} catch (err) {
			expect(err.message).toBe("could not empty the workdir, uncommitted changes")
		}
		await repo.nodeishFs.rm("/static/test1")

		await repo._emptyWorkdir()
		await repo._checkOutPlaceholders()

		await repo.nodeishFs.mkdir("/static/test/nested/deep/deeper", { recursive: true })

		await repo.nodeishFs.writeFile("/static/test/nested/deep/test1", "file content\n")
		await repo.nodeishFs.writeFile("/static/test/nested/deep/deeper/test3", "file content3\n")
		await repo.nodeishFs.writeFile("/static/test/nested/test2", "file content2\n")
		await repo.nodeishFs.writeFile("/static/test/nested/.gitignore", "deep\ntestparent\n")
		await repo.nodeishFs.writeFile("/static/test/testparent", "file content\n")

		const status = (await repo.statusList({ includeStatus: ["materialized", "ignored"] })).filter(
			([name]) => !name.startsWith(".git/")
		)

		expect(status).toStrictEqual([
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
				".gitignore",
				"unmodified",
				{
					headOid: "6635cf5542756197081eedaa1ec3a7c2c5a0b537",
					stageOid: "6635cf5542756197081eedaa1ec3a7c2c5a0b537",
					workdirOid: "6635cf5542756197081eedaa1ec3a7c2c5a0b537",
				},
			],
			[
				"static/test/nested/.gitignore",
				"*untracked",
				{
					headOid: undefined,
					stageOid: undefined,
					workdirOid: "42",
				},
			],
			[
				"static/test/nested/deep",
				"ignored",
				{
					headOid: undefined,
					stageOid: undefined,
					workdirOid: "ignored",
				},
			],
			[
				"static/test/nested/deep/deeper",
				"ignored",
				{
					headOid: undefined,
					stageOid: undefined,
					workdirOid: "ignored",
				},
			],
			[
				"static/test/nested/deep/deeper/test3",
				"ignored",
				{
					headOid: undefined,
					stageOid: undefined,
					workdirOid: "ignored",
				},
			],
			[
				"static/test/nested/deep/test1",
				"ignored",
				{
					headOid: undefined,
					stageOid: undefined,
					workdirOid: "ignored",
				},
			],
			[
				"static/test/nested/test2",
				"*untracked",
				{
					headOid: undefined,
					stageOid: undefined,
					workdirOid: "42",
				},
			],
			[
				"static/test/testparent",
				"*untracked",
				{
					headOid: undefined,
					stageOid: undefined,
					workdirOid: "42",
				},
			],
		])
	})

	it("uses standard commit logic for non whitelisted repos", async () => {
		const nonWhitelistedRepo = await openRepository(
			"https://github.com/janfjohannes/unicode-bug-issues-1404",
			{
				nodeishFs: createNodeishMemoryFs(),
			}
		)
		expect(nonWhitelistedRepo._experimentalFeatures).toStrictEqual({})
	})

	it("exposes proper origin", async () => {
		const gitOrigin = await repository.getOrigin()
		expect(gitOrigin).toBe("github.com/inlang/ci-test-repo.git")
	})

	it("finds initial commit of repo", async () => {
		const fs = createNodeishMemoryFs()

		const snapshot = JSON.parse(
			readFileSync(resolve(__dirname, "../mocks/ci-test-repo-no-shallow.json"), {
				encoding: "utf-8",
			})
		)
		fromSnapshot(fs, snapshot)

		const repo = await openRepository("file://", {
			nodeishFs: fs,
			branch: "test-symlink",
		})

		const firstHash = await repo.getFirstCommitHash()	
		expect(firstHash).toBe("244e3ce8c3335530ac0cd07e669b964bceb3b787")
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

// TODO: pull integration tests
