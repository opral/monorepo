import * as vscode from "vscode"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { settingsView, createSettingsWebviewProvider } from "./settingsView.js"
import { state } from "../state.js"

vi.mock("vscode", () => ({
	Uri: {
		file: vi.fn().mockImplementation((path) => ({
			toString: () => path,
		})),
		// @ts-expect-error
		joinPath: vi.fn().mockImplementation((...args) => ({
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
			settings: vi.fn().mockReturnValue({ some: "settings" }),
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

		const localResourceRootsStrings = webviewView.webview.options.localResourceRoots?.map((uri) =>
			uri.toString()
		)

		expect(localResourceRootsStrings).toEqual([mockExtensionPath])
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
			settings: { some: "settings" },
		})

		expect(mockSetSettings).toHaveBeenCalled()
	})
})
