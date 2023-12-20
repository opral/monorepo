import { generateProjectId } from "./generateProjectId.js"
import { describe, it, expect } from "vitest"
import { openRepository } from "@lix-js/client/src/openRepository.ts"
import { createNodeishMemoryFs, fromSnapshot } from "@lix-js/fs"
// eslint-disable-next-line no-restricted-imports -- this is a test
import { readFileSync } from "node:fs"

describe("generateProjectId", async () => {
	const nodeishFs = createNodeishMemoryFs()
	const snapshot = JSON.parse(readFileSync("./src/mocks/ci-test-repo.json", { encoding: "utf-8" }))
	fromSnapshot(nodeishFs, snapshot)

	const repo = await openRepository("https://github.com/inlang/ci-test-repo", {
		nodeishFs,
	})

	repo.getMeta = async () => {
		return {
			id: "34c48e4ba4c128582466b8dc1330feac0733880b35f467f4161e259070d24a31",
			name: "ci-test-repo",
			isPrivate: false,
			isFork: true,
			permissions: { admin: false, push: false, pull: false },
			owner: { name: undefined, email: undefined, login: "inlang" },
			parent: { url: "github.com/inlang/example.git", fullName: "inlang/example" },
		}
	}

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
