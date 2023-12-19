import { generateProjectId } from "./generateProjectId.js"
import { describe, it, expect } from "vitest"
import { openRepository } from "@lix-js/client"
import { createNodeishMemoryFs } from "@lix-js/fs"

describe("generateProjectId", async () => {
	const repo = await openRepository("https://github.com/inlang/ci-test-repo", {
		nodeishFs: createNodeishMemoryFs(),
	})

	it("should generate a project id", async () => {
		const projectId = await generateProjectId(repo, "mocked_project_path")
		expect(projectId).toBe("0c83325bf9068eb01091c522d4b8e3765aff42e36fc781c041b44439bbe3e734")
	})

	it("should return undefined if repoMeta contains error", async () => {
		const errorRepo = await openRepository("https://github.com/inlang/no-exist", {
			nodeishFs: createNodeishMemoryFs(),
		})

		const projectId = await generateProjectId(errorRepo, "mocked_project_path")
		expect(projectId).toBeUndefined()
	})
})
