import { generateProjectId } from "./generateProjectId.js"
import { describe, it, expect } from "vitest"
import { openRepository } from "@lix-js/client/src/openRepository.ts"
import { mockRepo, createNodeishMemoryFs } from "@lix-js/client"
import { type Snapshot } from "@lix-js/fs"
// eslint-disable-next-line no-restricted-imports -- test
import { readFileSync } from "node:fs"

describe("generateProjectId", async () => {
	const ciTestRepo: Snapshot = JSON.parse(
		readFileSync("./mocks/ci-test-repo.json", { encoding: "utf-8" })
	)
	const repo = await mockRepo({ fromSnapshot: ciTestRepo as Snapshot })

	it("should generate a project id", async () => {
		const projectId = await generateProjectId(repo, "mocked_project_path")
		expect(projectId).toBe("1e1f379d047dc95b577566532478ae89b32d7b545724bc470b4a1677c158910b")
	})

	it("should return undefined if repoMeta contains error", async () => {
		const errorRepo = await openRepository("https://github.com/inlang/no-exist", {
			nodeishFs: createNodeishMemoryFs(),
		})

		const projectId = await generateProjectId(errorRepo, "mocked_project_path")
		expect(projectId).toBeUndefined()
	})
})
