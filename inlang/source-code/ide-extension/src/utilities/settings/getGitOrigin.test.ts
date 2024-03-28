import { describe, it, expect, vi } from "vitest"
import { createNodeishMemoryFs, fromSnapshot as loadSnapshot, type Snapshot } from "@lix-js/fs"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

vi.mock("vscode", () => ({
	workspace: {
		workspaceFolders: [{ uri: { fsPath: "src" } }],
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

describe("getGitOrigin", async () => {
	const { getGitOrigin } = await import("./getGitOrigin.js")

	it("should return the parsed git origin URL", async () => {
		const origin = await getGitOrigin()
		expect(origin).toEqual("github.com/inlang/ci-test-repo.git")
	})

	it.todo("should handle errors and return undefined", async () => {
		// FIXME: either return not existing worpsace forlder here as mock or mock the findRepoRoot as a before
		const origin = await getGitOrigin()
		expect(origin).toBeUndefined()
	})
})
