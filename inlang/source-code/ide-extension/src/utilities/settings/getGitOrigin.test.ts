import { describe, it, expect, vi, beforeEach } from "vitest"
import { createNodeishMemoryFs, fromSnapshot as loadSnapshot, type Snapshot } from "@lix-js/fs"
import * as gitClient from "@lix-js/client"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

let workspaceFoldersMock: { uri: { fsPath: string } }[] | undefined
vi.mock("vscode", () => ({
	workspace: {
		get workspaceFolders() {
			return workspaceFoldersMock
		},
	},
}))

vi.mock("node:fs/promises", () => {
	const nodeishFs = createNodeishMemoryFs()

	const ciTestRepo: Snapshot = JSON.parse(
		readFileSync(resolve(__dirname, "../../../test/mocks/ci-test-repo.json"), {
			encoding: "utf-8",
		})
	)

	loadSnapshot(nodeishFs, ciTestRepo)
	nodeishFs._original_unwrapped_fs = undefined

	return nodeishFs
})

vi.mock("process", () => ({
	cwd: () => "/non/existent/directory",
}))

vi.mock("@lix-js/client", () => ({
	findRepoRoot: vi.fn(),
	openRepository: vi.fn(),
}))

describe("getGitOrigin", () => {
	let getGitOrigin: any

	beforeEach(async () => {
		vi.resetAllMocks()
		getGitOrigin = (await import("./getGitOrigin.js")).getGitOrigin
		workspaceFoldersMock = undefined
	})

	it("should return the parsed git origin URL when workspace is present", async () => {
		// @ts-expect-error
		gitClient.findRepoRoot.mockResolvedValue("/mocked/repo/root")
		// @ts-expect-error
		gitClient.openRepository.mockResolvedValue({
			getOrigin: () => Promise.resolve("github.com/inlang/ci-test-repo.git"),
		})

		workspaceFoldersMock = [{ uri: { fsPath: "src" } }]
		const origin = await getGitOrigin()
		expect(origin).toEqual("github.com/inlang/ci-test-repo.git")
	})

	it("should handle errors and return undefined when no workspace folder is found", async () => {
		// @ts-expect-error
		gitClient.findRepoRoot.mockResolvedValue(undefined)

		const origin = await getGitOrigin()
		expect(origin).toBeUndefined()
	})
})
