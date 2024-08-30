import { beforeEach, describe, expect, it, vi } from "vitest"
import * as vscode from "vscode"
import { state } from "../state.js"
import {
	createMessageHtml,
	createNoMessagesFoundHtml,
	createMessagesLoadingHtml,
	getHtml,
	getTranslationsTableHtml,
	messageView,
} from "./messages.js"

vi.mock("vscode", () => ({
	window: {
		activeTextEditor: undefined,
		onDidChangeActiveTextEditor: vi.fn(),
		registerWebviewViewProvider: vi.fn(),
	},
	workspace: {
		onDidChangeTextDocument: vi.fn(),
		onDidChangeConfiguration: vi.fn(),
	},
	Uri: {
		joinPath: vi.fn(),
	},
	commands: {
		executeCommand: vi.fn(),
	},
}))

vi.mock("../state.js", () => ({
	state: vi.fn(),
}))

describe("Message Webview Provider Tests", () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it("should create HTML for a message", () => {
		// @ts-expect-error
		state.mockReturnValue({
			project: {
				settings: new Map().set("experimental", { aliases: true }),
			},
			selectedProjectPath: "/workspace/project",
		})

		const html = createMessageHtml({
			bundle: {
				id: "message-id",
				alias: { aliasKey: "aliasValue" },
				messages: [
					{
						id: "message-id",
						bundleId: "bundle-id",
						locale: "en",
						declarations: [],
						selectors: [],
						variants: [
							{
								id: "variant-id",
								match: {},
								messageId: "message-id",
								pattern: [{ type: "text", value: "Hello" }],
							},
						],
					},
				],
			},
			isHighlighted: false,
			workspaceFolder: {
				uri: { fsPath: "/workspace/project" },
			} as vscode.WorkspaceFolder,
		})

		expect(html).toContain("message-id")
		expect(html).toContain("aliasValue")
		expect(html).toContain("Hello")
	})

	it("should handle cases where settings are not available", () => {
		// @ts-expect-error
		state.mockReturnValue({
			project: {
				settings: new Map(),
			},
		})

		const html = createMessageHtml({
			bundle: {
				id: "message-id",
				alias: { aliasKey: "aliasValue" },
				messages: [],
			},
			isHighlighted: false,
			workspaceFolder: {
				uri: { fsPath: "/workspace/project" },
			} as vscode.WorkspaceFolder,
		})

		expect(html).toContain("message-id")
		expect(html).not.toContain("aliasValue") // Since aliases should be disabled
	})

	it("should create a translations table for a message", () => {
		const html = getTranslationsTableHtml({
			bundle: {
				id: "message-id",
				alias: {},
				messages: [
					{
						id: "message-id",
						bundleId: "bundle-id",
						locale: "en",
						declarations: [],
						selectors: [],
						variants: [
							{
								id: "variant-id",
								match: {},
								messageId: "message-id",
								pattern: [{ type: "text", value: "Hello" }],
							},
						],
					},
				],
			},
			workspaceFolder: {
				uri: { fsPath: "/workspace/project" },
			} as vscode.WorkspaceFolder,
		})

		expect(html).toContain("Language")
		expect(html).toContain("Translation")
		expect(html).toContain("Hello")
	})

	it("should handle cases where there are no translations", () => {
		const html = getTranslationsTableHtml({
			bundle: {
				id: "message-id",
				alias: {},
				messages: [],
			},
			workspaceFolder: {
				uri: { fsPath: "/workspace/project" },
			} as vscode.WorkspaceFolder,
		})

		expect(html).toContain("No translations available")
	})

	it("should create 'No Messages Found' HTML", () => {
		const html = createNoMessagesFoundHtml()
		expect(html).toContain("No messages found")
	})

	it("should create 'Loading Messages' HTML", () => {
		const html = createMessagesLoadingHtml()
		expect(html).toContain("Loading messages...")
	})

	it("should create the complete webview HTML", () => {
		const html = getHtml({
			mainContent: "<div>Main Content</div>",
			context: {
				extensionUri: vscode.Uri.file("/path/to/extension"),
			} as vscode.ExtensionContext,
			webview: {
				asWebviewUri: (uri: vscode.Uri) => uri,
				cspSource: "cspSource",
			} as vscode.Webview,
		})

		expect(html).toContain("<div>Main Content</div>")
		expect(html).toContain("Content-Security-Policy")
	})

	it("should register the message webview provider", () => {
		const context = {
			subscriptions: [],
		} as unknown as vscode.ExtensionContext

		messageView({
			context,
			workspaceFolder: { name: "", index: 1, uri: vscode.Uri.file("/path/to/workspace") },
		})

		expect(vscode.window.registerWebviewViewProvider).toHaveBeenCalled()
	})
})
