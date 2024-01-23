import { describe, it, expect, vi } from "vitest"
import * as vscode from "vscode"
import { createNoProjectsFoundViewProvider, getNoProjectsFoundHtml } from "./gettingStarted.js"
vi.mock("vscode", () => ({
	commands: {
		registerCommand: vi.fn(),
	},
	window: {
		registerWebviewViewProvider: vi.fn(),
	},
	WebviewView: class {},
	CancellationTokenSource: class {
		token = {}
	},
	EventEmitter: vi.fn(),
}))

describe("createNoProjectsFoundViewProvider", () => {
	it("should create a WebviewViewProvider", () => {
		const provider = createNoProjectsFoundViewProvider()
		expect(provider).toBeDefined()
		expect(typeof provider.resolveWebviewView).toBe("function")
	})

	it("should set webview options and HTML content", () => {
		const mockWebviewView: vscode.WebviewView = {
			webview: {
				options: {},
				html: "",
			},
		} as unknown as vscode.WebviewView
		const mockContext = {
			state: {},
		}
		const mockToken = new vscode.CancellationTokenSource().token

		const provider = createNoProjectsFoundViewProvider()
		provider.resolveWebviewView(mockWebviewView, mockContext, mockToken)

		expect(mockWebviewView.webview.options.enableScripts).toBe(false)
		expect(mockWebviewView.webview.html).toContain("No Projects Found")
	})
})

describe("getNoProjectsFoundHtml", () => {
	it("should return the correct HTML string", () => {
		const html = getNoProjectsFoundHtml()
		expect(html).toContain("<title>No Projects Found</title>")
		expect(html).toContain("<h1>No project found</h1>")
	})
})
