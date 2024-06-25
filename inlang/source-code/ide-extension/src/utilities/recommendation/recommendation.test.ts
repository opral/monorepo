import { describe, it, expect, vi, beforeEach } from "vitest"
import * as vscode from "vscode"
import {
	recommendationBannerView,
	createRecommendationView,
	getRecommendationViewHtml,
} from "./recommendation.js"
import { createNodeishMemoryFs, type NodeishFilesystem } from "@lix-js/fs"

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

describe("recommendationBannerView", () => {
	beforeEach(() => {
		vi.resetAllMocks()
	})

	it("should register a webview view provider", async () => {
		const args = {
			nodeishFs: createNodeishMemoryFs(),
			workspaceFolder: {
				uri: { fsPath: "/path/to/workspace" } as vscode.Uri,
				name: "test-workspace",
				index: 0,
			},
			context: {} as vscode.ExtensionContext,
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
		const result = createRecommendationView({
			fs: createNodeishMemoryFs(),
			workspaceFolder: fakeWorkspaceFolder,
			context: {} as vscode.ExtensionContext,
		})
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
		const result = createRecommendationView({
			fs: createNodeishMemoryFs(),
			workspaceFolder: fakeWorkspaceFolder,
			context: {} as vscode.ExtensionContext,
		})
		expect(typeof result.resolveWebviewView).toBe("function")
	})
})

describe("getRecommendationBannerHtml", () => {
	beforeEach(() => {
		vi.resetAllMocks()
	})

	it("should return html", async () => {
		const args = {
			webview: {} as vscode.Webview,
			fs: {} as NodeishFilesystem,
			workspaceFolder: {} as vscode.WorkspaceFolder,
			context: {} as vscode.ExtensionContext,
		}
		const result = await getRecommendationViewHtml(args)
		expect(result).toContain(`<html lang="en">`)
	})
})
