import { describe, it, expect, vi, beforeEach } from "vitest"
import { getGitOrigin } from "./getGitOrigin.js"
import * as lixClient from "@lix-js/client"

// Mocks
vi.mock("vscode", () => ({
	workspace: {
		workspaceFolders: [{ uri: { fsPath: "mock/path" } }],
	},
}))
vi.mock("@lix-js/client", () => ({
	findRepoRoot: vi.fn().mockResolvedValue("mock/root"),
	_listRemotes: vi.fn().mockResolvedValue([{ url: "git@github.com:user/repo.git" }]),
}))
vi.mock("node:fs/promises", () => ({}))
vi.mock("@inlang/telemetry", () => ({
	parseOrigin: vi.fn().mockReturnValue("https://github.com/user/repo"),
}))

describe("getGitOrigin", () => {
	beforeEach(() => {
		vi.clearAllMocks()
		// @ts-expect-error
		lixClient.findRepoRoot.mockResolvedValue("mock/root")
		// @ts-expect-error
		lixClient._listRemotes.mockResolvedValue([{ url: "git@github.com:user/repo.git" }])
	})

	it("should return the parsed git origin URL", async () => {
		const origin = await getGitOrigin()
		expect(origin).toEqual("https://github.com/user/repo")
	})

	it("should handle errors and return undefined", async () => {
		// @ts-expect-error
		lixClient.findRepoRoot.mockRejectedValueOnce(new Error("Mock error"))
		const origin = await getGitOrigin()
		expect(origin).toBeUndefined()
	})
})
