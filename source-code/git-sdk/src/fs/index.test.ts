import { fs } from "./index.js"
import { raw } from "../api/index.js"
import { describe, it, expect } from "vitest"

describe("ensure that filesystem is compatible with the api", () => {
	it("should be able to initialize a repository", async () => {
		await raw.init({ fs, dir: "/test-repo" })
		const root = await fs.promises.readdir("/")
		expect(root).toContain("test-repo")
		const testRepoDir = await fs.promises.readdir("/test-repo")
		// .git directory = repository has been initialized
		expect(testRepoDir).toContain(".git")
	})
})
