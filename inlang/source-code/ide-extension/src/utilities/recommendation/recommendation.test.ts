import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import * as vscode from "vscode"
import * as fs from "node:fs"
import {
	isInWorkspaceRecommendation,
	isDisabledRecommendation,
	recommendationBannerView,
	createRecommendationBanner,
	getRecommendationBannerHtml,
	updateDisabledRecommendation,
} from "./recommendation.js"
import { getSetting, updateSetting } from "../settings/index.js"
import { getGitOrigin } from "../settings/getGitOrigin.js"

vi.mock("vscode", () => ({
	resolveWebviewView: vi.fn(),
	window: {
		createWebviewPanel: vi.fn(),
		registerWebviewViewProvider: vi.fn(),
	},
	WebviewView: class {},
	commands: {
		executeCommand: vi.fn(),
	},
}))
vi.mock("node:path", () => ({
	join: (...args: string[]) => args.join("/"),
}))
vi.mock("node:fs", () => ({
	existsSync: vi.fn(),
	readFileSync: vi.fn(),
}))
vi.mock("../settings/getGitOrigin.js", () => ({ getGitOrigin: vi.fn() }))
vi.mock("../settings/index.js", () => ({
	getSetting: vi.fn(),
	updateSetting: vi.fn(),
}))

describe("isInWorkspaceRecommendation", () => {
	const fakeWorkspaceFolder: vscode.WorkspaceFolder = {
		uri: { fsPath: "/path/to/workspace" } as vscode.Uri,
		name: "test-workspace",
		index: 0,
	}

	beforeEach(() => {
		// Reset all mocks before each test
		vi.resetAllMocks()
	})

	afterEach(() => {
		vi.restoreAllMocks()
	})

	it("should return true if inlang.vs-code-extension is in workspace recommendations", async () => {
		vi.mocked(fs.existsSync).mockReturnValue(true)
		vi.mocked(fs.readFileSync).mockReturnValue(
			JSON.stringify({
				recommendations: ["inlang.vs-code-extension"],
			})
		)

		const result = await isInWorkspaceRecommendation({ workspaceFolder: fakeWorkspaceFolder })
		expect(result).toBe(true)
	})

	it("should return false if inlang.vs-code-extension is not in workspace recommendations", async () => {
		vi.mocked(fs.existsSync).mockReturnValue(true)
		vi.mocked(fs.readFileSync).mockReturnValue(
			JSON.stringify({
				recommendations: ["some-other-extension"],
			})
		)

		const result = await isInWorkspaceRecommendation({ workspaceFolder: fakeWorkspaceFolder })
		expect(result).toBe(false)
	})
})

describe("isDisabledRecommendation", () => {
	beforeEach(() => {
		vi.resetAllMocks()
	})

	it("should return true if recommendation is disabled", async () => {
		vi.mocked(getSetting).mockResolvedValue(["some-git-origin"])
		vi.mocked(getGitOrigin).mockResolvedValue("some-git-origin")

		const result = await isDisabledRecommendation()
		expect(result).toBe(true)
	})

	it("should return false if recommendation is not disabled", async () => {
		vi.mocked(getSetting).mockResolvedValue(["other-git-origin"])
		vi.mocked(getGitOrigin).mockResolvedValue("some-git-origin")

		const result = await isDisabledRecommendation()
		expect(result).toBe(false)
	})
})

describe("updateDisabledRecommendation", () => {
	beforeEach(() => {
		vi.resetAllMocks()
	})

	it("should update the disabled recommendation setting", async () => {
		vi.mocked(getSetting).mockResolvedValue(["other-git-origin"])
		vi.mocked(getGitOrigin).mockResolvedValue("some-git-origin")

		await updateDisabledRecommendation()

		expect(updateSetting).toHaveBeenCalledWith("disableRecommendation", [
			"other-git-origin",
			"some-git-origin",
		])
	})
})

describe("recommendationBannerView", () => {
	beforeEach(() => {
		vi.resetAllMocks()
	})

	it("should register a webview view provider", async () => {
		const args = {
			workspaceFolder: {
				uri: { fsPath: "/path/to/workspace" } as vscode.Uri,
				name: "test-workspace",
				index: 0,
			},
		}

		await recommendationBannerView(args)

		expect(vscode.window.registerWebviewViewProvider).toHaveBeenCalledWith(
			"recommendationBanner",
			expect.anything()
		)
	})
})

describe("createRecommendationBanner", () => {
	const fakeWorkspaceFolder: vscode.WorkspaceFolder = {
		uri: { fsPath: "/path/to/workspace" } as vscode.Uri,
		name: "test-workspace",
		index: 0,
	}

	it("should return an object with a resolveWebviewView function", () => {
		const result = createRecommendationBanner({ workspaceFolder: fakeWorkspaceFolder })
		expect(typeof result.resolveWebviewView).toBe("function")
	})
})

describe("createRecommendationBanner", () => {
	const fakeWorkspaceFolder: vscode.WorkspaceFolder = {
		uri: { fsPath: "/path/to/workspace" } as vscode.Uri,
		name: "test-workspace",
		index: 0,
	}

	it("should return an object with a resolveWebviewView function", () => {
		const result = createRecommendationBanner({ workspaceFolder: fakeWorkspaceFolder })
		expect(typeof result.resolveWebviewView).toBe("function")
	})
})

describe("getRecommendationBannerHtml", () => {
	beforeEach(() => {
		vi.resetAllMocks()
	})

	it("should return html", () => {
		const args = {
			webview: {} as vscode.Webview,
		}
		const result = getRecommendationBannerHtml(args)
		expect(result).toContain(`<html lang="en">`)
	})
})
