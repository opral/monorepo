import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import * as vscode from "vscode"
import { state } from "../state.js"
import type { Message } from "@inlang/sdk"
import {
	createMessageHtml,
	createMessageWebviewProvider,
	createNoMessagesFoundHtml,
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

vi.mock("../../configuration.js", () => ({
	CONFIGURATION: {
		EVENTS: {
			ON_DID_EXTRACT_MESSAGE: { event: vi.fn() },
			ON_DID_CREATE_MESSAGE: { event: vi.fn() },
			ON_DID_EDIT_MESSAGE: { event: vi.fn() },
			ON_DID_PROJECT_TREE_VIEW_CHANGE: { event: vi.fn() },
		},
		STRINGS: {
			MISSING_TRANSLATION_MESSAGE: "Missing Translation",
		},
	},
}))

// Mock data
const mockMessage: Message = {
	id: "testMessage",
	alias: {},
	selectors: [],
	variants: [
		{
			languageTag: "en",
			match: ["Test Message"],
			pattern: [
				{
					type: "Text",
					value: "Test Message",
				},
			],
		},
	],
}

describe("Message Webview Provider Tests", () => {
	let context: vscode.ExtensionContext

	beforeEach(() => {
		context = { subscriptions: [] } as unknown as vscode.ExtensionContext
		vi.mocked(state).mockReturnValue({
			project: {
				query: {
					messages: {
						// @ts-expect-error
						getAll: vi.fn().mockReturnValue([mockMessage]),
					},
				},
				// @ts-expect-error
				settings: vi.fn().mockReturnValue({
					locales: ["en"],
				}),
				selectedProjectPath: "/test/path",
			},
		})
	})

	afterEach(() => {
		vi.clearAllMocks()
	})

	it("should create and return a webview provider", () => {
		const workspaceFolder = {
			uri: { fsPath: "/test/path/project.inlang" },
		} as vscode.WorkspaceFolder
		const provider = createMessageWebviewProvider({ context, workspaceFolder })
		expect(provider).toBeDefined()
		expect(typeof provider.resolveWebviewView).toBe("function")
	})

	it("should create HTML for a message", () => {
		const workspaceFolder = {
			uri: { fsPath: "/test/path/project.inlang" },
		} as vscode.WorkspaceFolder
		vi.mocked(state).mockReturnValue({
			project: {
				query: {
					messages: {
						// @ts-expect-error
						getAll: vi.fn().mockReturnValue([mockMessage]),
					},
				},
				// @ts-expect-error
				settings: vi.fn().mockReturnValue({
					locales: ["en"],
				}),
			},
			selectedProjectPath: "/test/path",
		})
		const html = createMessageHtml({ message: mockMessage, isHighlighted: true, workspaceFolder })
		expect(html).toContain("testMessage")
		expect(html).toContain("collapsible")
	})

	it("should return correct HTML when no messages are found", () => {
		const html = createNoMessagesFoundHtml()
		expect(html).toContain(
			`No messages found. Extract text to create a message by selecting a text and using the "Extract message" quick action / command.`
		)
	})

	it("should create a translations table for a message", () => {
		const workspaceFolder = {
			uri: { fsPath: "/test/path/project.inlang" },
		} as vscode.WorkspaceFolder
		vi.mocked(state).mockReturnValue({
			project: {
				query: {
					messages: {
						// @ts-expect-error
						getAll: vi.fn().mockReturnValue([mockMessage]),
					},
				},
				// @ts-expect-error
				settings: vi.fn().mockReturnValue({
					locales: ["en"],
				}),
			},
			selectedProjectPath: "/test/path",
		})
		const html = getTranslationsTableHtml({ message: mockMessage, workspaceFolder })
		expect(html).toContain("Test Message")
		expect(html).toContain("en")
	})

	it("should generate HTML for the webview", () => {
		const mockWebview = {
			asWebviewUri: vi.fn((uri) => uri),
			options: {},
			html: "",
			onDidReceiveMessage: vi.fn(),
			cspSource: "mockCspSource",
		}
		const html = getHtml({
			mainContent: "Main Content",
			context,
			webview: mockWebview as unknown as vscode.Webview,
		})
		expect(html).toContain("Main Content")
	})

	it("should register a webview view provider", async () => {
		const workspaceFolder = {
			uri: { fsPath: "/test/path/project.inlang" },
		} as vscode.WorkspaceFolder
		await messageView({ context, workspaceFolder })
		expect(vscode.window.registerWebviewViewProvider).toHaveBeenCalled()
	})
})
