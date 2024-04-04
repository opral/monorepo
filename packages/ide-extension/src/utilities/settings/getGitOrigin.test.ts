import { describe, it, expect } from "vitest"
import { createNodeishMemoryFs, fromSnapshot as loadSnapshot, type Snapshot } from "@lix-js/fs"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { _getGitOrigin } from "./_getGitOrigin.js"

const nodeishFs = createNodeishMemoryFs()

const ciTestRepo: Snapshot = JSON.parse(
	readFileSync(resolve(__dirname, "../../../test/mocks/ci-test-repo.json"), {
		encoding: "utf-8",
	})
)

loadSnapshot(nodeishFs, ciTestRepo)

describe("getGitOrigin", () => {
	it("should return the parsed git origin URL when workspace is present", async () => {
		const origin = await _getGitOrigin({ fs: nodeishFs, workspaceRoot: "src" })
		expect(origin).toEqual("github.com/inlang/ci-test-repo.git")
	})

	it("should handle errors and return undefined when no workspace folder is found", async () => {
		await nodeishFs.rm(".git", { recursive: true })
		const origin = await _getGitOrigin({ fs: nodeishFs, workspaceRoot: "src" })
		expect(origin).toBeUndefined()
	})
})
