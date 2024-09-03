import { beforeEach, describe, expect, it, vi } from "vitest"
import * as vscode from "vscode"
import { state } from "../state.js"
import {
	createMessageHtml,
	createNoMessagesFoundHtml,
	createMessagesLoadingHtml,
	getHtml,
	getTranslationsTableHtml,
} from "./messages.js"

// Mocking vscode module and state module
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
		file: vi.fn((path: string) => ({ fsPath: path })),
	},
	commands: {
		executeCommand: vi.fn(),
	},
	Webview: vi.fn(() => ({
		asWebviewUri: vi.fn(),
		cspSource: "cspSource",
	})),
	EventEmitter: vi.fn(),
}))

vi.mock("../state.js", () => ({
	state: vi.fn(),
}))

describe("Message Webview Provider Tests", () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it("should create HTML for a message", async () => {
		vi.mocked(state).mockReturnValue({
			project: {
				// @ts-expect-error
				settings: {
					get: vi.fn().mockResolvedValue({
						baseLocale: "en",
						locales: ["en", "de"],
						experimental: {
							aliases: true,
						},
					}),
				},
			},
			selectedProjectPath: "/workspace/project",
		})

		// Creating a message HTML using the mocked data
		const html = await createMessageHtml({
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

		// Validating that the created HTML contains the expected content
		expect(html).toContain("message-id")
		expect(html).toContain("aliasValue")
		expect(html).toContain("Hello")
	})

	it("should handle cases where settings are not available", async () => {
		// Mocking state to return a project with no specific settings
		vi.mocked(state).mockReturnValue({
			project: {
				// @ts-expect-error
				settings: {
					get: vi.fn().mockResolvedValue({}),
				},
			},
			selectedProjectPath: "/workspace/project",
		})

		// Creating a message HTML without aliases enabled
		const html = await createMessageHtml({
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

		// Validating that the created HTML does not contain aliasValue since aliases are disabled
		expect(html).toContain("message-id")
		expect(html).not.toContain("aliasValue")
	})

	it("should create a translations table for a message", () => {
		// Creating a translations table HTML
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

		// Validating that the translations table contains the expected content
		expect(html).toContain("Language")
		expect(html).toContain("Translation")
		expect(html).toContain("Hello")
	})

	it("should handle cases where there are no translations", () => {
		// Creating a translations table HTML with no translations available
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

		// Validating that the HTML indicates no translations are available
		expect(html).toContain("No translations available")
	})

	it("should create 'No Messages Found' HTML", () => {
		// Creating HTML for when no messages are found
		const html = createNoMessagesFoundHtml()

		// Validating that the created HTML contains the expected content
		expect(html).toContain("No messages found")
	})

	it("should create 'Loading Messages' HTML", () => {
		// Creating HTML for when messages are loading
		const html = createMessagesLoadingHtml()

		// Validating that the created HTML contains the expected content
		expect(html).toContain("Loading messages...")
	})

	it("should create the complete webview HTML", () => {
		// Mocking the context and webview
		const context = {
			extensionUri: vscode.Uri.file("/path/to/extension"),
		} as vscode.ExtensionContext

		// @ts-expect-error
		const webview = new vscode.Webview()

		// Creating the complete webview HTML
		const html = getHtml({
			mainContent: "<div>Main Content</div>",
			context,
			webview,
		})

		// Validating that the webview HTML contains the expected content
		expect(html).toContain("<div>Main Content</div>")
		expect(html).toContain("Content-Security-Policy")
	})
})
