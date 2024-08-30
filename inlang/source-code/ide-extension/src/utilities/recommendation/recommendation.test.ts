import { describe, it, expect, vi, beforeEach } from "vitest"
import * as vscode from "vscode"
import {
	recommendationBannerView,
	createRecommendationView,
	getRecommendationViewHtml,
} from "./recommendation.js"
import * as fs from "node:fs/promises"

vi.mock("vscode", () => ({
	resolveWebviewView: vi.fn(),
	window: {
		createWebviewPanel: vi.fn(),
		registerWebviewViewProvider: vi.fn(),
	},
	WebviewView: class {
		webview = {
			asWebviewUri: (uri: vscode.Uri) => uri.toString(),
			options: {},
			html: "",
			onDidReceiveMessage: vi.fn(),
			postMessage: vi.fn(),
			cspSource: "",
		}
	},
	commands: {
		executeCommand: vi.fn(),
	},
	EventEmitter: class {
		on = vi.fn()
		fire = vi.fn()
	},
	Uri: {
		file: vi.fn(),
		joinPath: vi.fn((...args: string[]) => args.join("/")),
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
			fs: {} as typeof fs,
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
			fs: fs,
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
			fs: fs,
			workspaceFolder: fakeWorkspaceFolder,
			context: {} as vscode.ExtensionContext,
		})
		expect(typeof result.resolveWebviewView).toBe("function")
	})
})

describe("getRecommendationBannerHtml", () => {
	const fakeWorkspaceFolder: vscode.WorkspaceFolder = {
		uri: { fsPath: "/path/to/workspace" } as vscode.Uri,
		name: "test-workspace",
		index: 0,
	}

	beforeEach(() => {
		vi.resetAllMocks()
	})

	it("should return html", async () => {
		const args = {
			webview: {
				asWebviewUri: (uri: vscode.Uri) => (uri ? uri.toString() : ""),
				options: {},
				html: "",
				onDidReceiveMessage: vi.fn(),
				postMessage: vi.fn(),
				cspSource: "self",
			} as unknown as vscode.Webview,
			fs: {} as typeof fs,
			workspaceFolder: fakeWorkspaceFolder,
			context: {} as vscode.ExtensionContext,
		}
		const result = await getRecommendationViewHtml(args)
		expect(result).toContain(`<html lang="en">`)
	})
})
