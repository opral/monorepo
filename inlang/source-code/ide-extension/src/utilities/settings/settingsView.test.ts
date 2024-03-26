import * as vscode from "vscode"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { settingsView, createSettingsWebviewProvider } from "./settingsView.js"
import { state } from "../state.js"

vi.mock("vscode", () => ({
	Uri: {
		file: vi.fn().mockImplementation((path) => ({
			// Mock `toString` to return the expected string path directly
			toString: () => path,
		})),
		// @ts-expect-error
		joinPath: vi.fn().mockImplementation((...args) => ({
			// Ensure the mock URI object's `toString` returns a concatenated path
			toString: () => args.join("/"),
		})),
	},
	window: {
		createWebviewView: () => ({
			webview: {
				options: {},
				html: "",
				onDidReceiveMessage: vi.fn(),
				asWebviewUri: vi.fn().mockImplementation((uri) => `mockedUriFor(${uri})`),
			},
		}),
		registerWebviewViewProvider: vi.fn(),
	},
	WebviewView: vi.fn(),
}))

vi.mock("../state", () => ({
	state: vi.fn().mockImplementation(() => ({
		project: {
			settings: vi.fn().mockReturnValue({
				/* Mock settings here */
			}),
			setSettings: vi.fn(),
		},
	})),
}))

describe("settingsView", () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it("registers the webview view provider correctly", async () => {
		const context = { subscriptions: { push: vi.fn() } } as unknown as vscode.ExtensionContext
		await settingsView({ context })

		expect(context.subscriptions.push).toHaveBeenCalled()
		expect(vscode.window.registerWebviewViewProvider).toHaveBeenCalledWith(
			"settingsView",
			expect.anything()
		)
	})
})

describe("createSettingsWebviewProvider", () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it("sets up webview options and HTML content correctly", () => {
		const mockExtensionPath = "path/to/extension"
		const context = { extensionPath: mockExtensionPath } as unknown as vscode.ExtensionContext
		const webviewView = {
			webview: {
				options: {},
				html: "",
				onDidReceiveMessage: vi.fn(),
				asWebviewUri: vi.fn((uri) => `mockedUriFor(${uri.toString()})`),
			},
		} as unknown as vscode.WebviewView

		const provider = createSettingsWebviewProvider({ context })
		provider.resolveWebviewView(webviewView)

		// Extract the string values from the mock Uri objects' toString method
		const localResourceRootsStrings = webviewView.webview.options.localResourceRoots?.map((uri) =>
			uri.toString()
		)

		// Assert the localResourceRoots contains the expected path strings
		expect(localResourceRootsStrings).toEqual([mockExtensionPath])

		// Assert the expected structure of the HTML content and other tests as before
		expect(webviewView.webview.html).toContain('<html lang="en">')

		// Simulate a message and test handling.
		const mockSetSettings = vi.fn()
		vi.mocked(state).mockImplementation(() => ({
			// @ts-expect-error
			project: {
				setSettings: mockSetSettings,
			},
		}))

		// @ts-expect-error
		webviewView.webview.onDidReceiveMessage.mock.calls[0][0]({
			command: "setSettings",
			settings: {
				/* Mock settings here */
			},
		})

		expect(mockSetSettings).toHaveBeenCalled()
	})
})
