import { describe, it, expect } from "vitest"
import { createNodeishMemoryFs, fromSnapshot as loadSnapshot, type Snapshot } from "@lix-js/fs"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { _getCurrentBranch } from "./_getCurrentBranch.js"

const nodeishFs = createNodeishMemoryFs()

const ciTestRepo: Snapshot = JSON.parse(
	readFileSync(resolve(__dirname, "../../../test/mocks/ci-test-repo.json"), {
		encoding: "utf-8",
	})
)

loadSnapshot(nodeishFs, ciTestRepo)

describe("getCurrentBranch", () => {
	it("should return the current git branch when the repository root is found", async () => {
		const branch = await _getCurrentBranch({ fs: nodeishFs, workspaceRoot: "src" })
		expect(branch).toEqual("test-symlink")
	})

	it("should return undefined when no repository root is found", async () => {
		// Correctly handle the case where the repository root is not found
		await nodeishFs.rm(".git", { recursive: true })
		const branch = await _getCurrentBranch({ fs: nodeishFs, workspaceRoot: "src" })
		expect(branch).toBeUndefined()
	})
})
