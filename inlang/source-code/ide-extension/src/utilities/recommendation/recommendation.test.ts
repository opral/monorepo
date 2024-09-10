import { describe, it, expect, vi, beforeEach } from "vitest"
import * as vscode from "vscode"
import {
	recommendationBannerView,
	createRecommendationView,
	getRecommendationViewHtml,
} from "./recommendation.js"
import * as fs from "node:fs/promises"

// Mocking VSCode APIs
vi.mock("vscode", () => ({
	resolveWebviewView: vi.fn(),
	window: {
		createWebviewPanel: vi.fn(),
		registerWebviewViewProvider: vi.fn(),
	},
	WebviewView: class {
		webview = {
			asWebviewUri: (uri: vscode.Uri) => (uri ? uri.toString() : "invalid-uri"),
			options: {},
			html: "",
			onDidReceiveMessage: vi.fn(),
			postMessage: vi.fn(),
			cspSource: "",
		}
		onDidDispose = vi.fn()
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
		parse: vi.fn((uri: string) => ({ toString: () => uri })),
	},
}))
vi.mock("node:path", () => ({
	join: (...args: string[]) => args.join("/"),
}))
vi.mock("node:fs", () => ({
	existsSync: vi.fn(),
	readFileSync: vi.fn(),
}))
vi.mock("../../configuration.js", () => ({
	CONFIGURATION: {
		EVENTS: {
			ON_DID_RECOMMENDATION_VIEW_CHANGE: {
				event: vi.fn(),
				fire: vi.fn(),
			},
		},
	},
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

describe("createRecommendationView", () => {
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

	it("should set up webview with scripts enabled and handle messages", async () => {
		// @ts-expect-error
		const webviewView = new vscode.WebviewView()
		const mockContext = {} as vscode.ExtensionContext

		const recommendationView = createRecommendationView({
			fs: fs,
			workspaceFolder: fakeWorkspaceFolder,
			context: mockContext,
		})

		await recommendationView.resolveWebviewView(webviewView)

		expect(webviewView.webview.options.enableScripts).toBe(true)

		webviewView.webview.onDidReceiveMessage({
			command: "addSherlockToWorkspace",
		})

		expect(webviewView.webview.onDidReceiveMessage).toHaveBeenCalledWith({
			command: "addSherlockToWorkspace",
		})
	})
})

describe("getRecommendationViewHtml", () => {
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
				asWebviewUri: (uri: vscode.Uri) => (uri ? uri.toString() : "invalid-uri"),
				options: {},
				html: "",
				onDidDispose: vi.fn(),
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

	it("should generate valid HTML structure with content", async () => {
		const args = {
			webview: {
				asWebviewUri: (uri: vscode.Uri) => (uri ? uri.toString() : "invalid-uri"),
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

		const html = await getRecommendationViewHtml(args)
		expect(html).toContain("To improve your i18n workflow:")
		expect(html).toContain('<div class="container">')
		expect(html).toContain('<html lang="en">')
	})
})
