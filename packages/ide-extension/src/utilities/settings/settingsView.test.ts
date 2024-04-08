import { describe, it, expect, vi } from "vitest"
import { settingsPanel, getWebviewContent } from "./settingsView.js"
import * as vscode from "vscode"

vi.mock("vscode", () => ({
	window: {
		createWebviewPanel: vi.fn().mockReturnValue({
			webview: {
				html: "",
				onDidReceiveMessage: vi.fn(),
				asWebviewUri: vi.fn().mockImplementation((uri: vscode.Uri) => uri),
			},
		}),
	},
	Uri: {
		file: vi.fn().mockReturnValue("mock-file-uri"),
		joinPath: vi.fn().mockReturnValue("mock-join-path-uri"),
	},
	ViewColumn: {
		One: 1,
	},
}))

vi.mock("../state.js", () => ({
	state: () => ({
		project: {
			settings: vi.fn().mockReturnValue({}),
			installed: {
				plugins: vi.fn().mockReturnValue([]),
				messageLintRules: vi.fn().mockReturnValue([]),
			},
		},
	}),
}))

describe("settingsPanel", () => {
	it("should create a webview panel with the correct properties", async () => {
		const mockContext = { extensionPath: "path/to/extension" } as unknown as vscode.ExtensionContext
		await settingsPanel({ context: mockContext })
		expect(vscode.window.createWebviewPanel).toHaveBeenCalledWith(
			"settingsPanel",
			"Settings",
			vscode.ViewColumn.One,
			expect.objectContaining({
				enableScripts: true,
				localResourceRoots: [expect.anything()],
			})
		)
	})
})

describe("getWebviewContent", () => {
	it("should return expected HTML content", () => {
		const mockWebview = { asWebviewUri: vi.fn() } as unknown as vscode.Webview
		const mockContext = { extensionUri: "uri" } as unknown as vscode.ExtensionContext
		// @ts-expect-error
		mockWebview.asWebviewUri.mockImplementation((uri: any) => uri)

		const htmlContent = getWebviewContent({ context: mockContext, webview: mockWebview })
		expect(htmlContent).toContain("<title>Settings</title>")
	})
})
