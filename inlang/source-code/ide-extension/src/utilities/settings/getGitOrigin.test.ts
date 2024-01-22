import { describe, it, expect, vi, beforeEach } from "vitest"
import { getGitOrigin } from "./getGitOrigin.js"
import * as isomorphicGit from "isomorphic-git"

// Mocks
vi.mock("vscode", () => ({
	workspace: {
		workspaceFolders: [{ uri: { fsPath: "mock/path" } }],
	},
}))
vi.mock("isomorphic-git", () => ({
	findRoot: vi.fn().mockResolvedValue("mock/root"),
	listRemotes: vi.fn().mockResolvedValue([{ url: "git@github.com:user/repo.git" }]),
}))
vi.mock("node:fs", () => ({}))
vi.mock("@inlang/telemetry", () => ({
	parseOrigin: vi.fn().mockReturnValue("https://github.com/user/repo"),
}))

describe("getGitOrigin", () => {
	beforeEach(() => {
		vi.clearAllMocks()
		// @ts-expect-error
		isomorphicGit.findRoot.mockResolvedValue("mock/root")
		// @ts-expect-error
		isomorphicGit.listRemotes.mockResolvedValue([{ url: "git@github.com:user/repo.git" }])
	})

	it("should return the parsed git origin URL", async () => {
		const origin = await getGitOrigin()
		expect(origin).toEqual("https://github.com/user/repo")
	})

	it("should handle errors and return undefined", async () => {
		// @ts-expect-error
		isomorphicGit.findRoot.mockRejectedValueOnce(new Error("Mock error"))
		const origin = await getGitOrigin()
		expect(origin).toBeUndefined()
	})
})
