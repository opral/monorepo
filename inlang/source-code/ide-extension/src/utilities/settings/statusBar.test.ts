import * as vscode from "vscode"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { statusBar, showStatusBar } from "./statusBar.js"
import { state } from "../state.js"
import { getSetting } from "./index.js"
import { CONFIGURATION } from "../../configuration.js"

vi.mock("vscode", () => ({
	window: {
		createStatusBarItem: vi.fn().mockReturnValue({
			dispose: vi.fn(),
			command: undefined,
			text: undefined,
			tooltip: undefined,
			show: vi.fn(),
		}),
	},
	StatusBarAlignment: {
		Right: 1,
	},
	commands: {
		registerCommand: vi.fn(),
	},
	EventEmitter: vi.fn().mockImplementation(() => ({
		event: vi.fn(),
	})),
}))

vi.mock("../state", () => ({
	state: vi.fn().mockImplementation(() => ({
		project: {
			settings: vi.fn().mockReturnValue({ sourceLanguageTag: "en" }),
		},
	})),
}))

vi.mock("./index", () => ({
	getSetting: vi.fn(),
}))

describe("statusBar", () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it("should subscribe to the appropriate events", async () => {
		const context = { subscriptions: { push: vi.fn() } } as unknown as vscode.ExtensionContext
		await statusBar({ context })

		expect(context.subscriptions.push).toHaveBeenCalledTimes(2)
		expect(CONFIGURATION.EVENTS.ON_DID_PROJECT_TREE_VIEW_CHANGE.event).toHaveBeenCalled()
		expect(CONFIGURATION.EVENTS.ON_DID_PREVIEW_LANGUAGE_TAG_CHANGE.event).toHaveBeenCalled()
	})
})

describe("showStatusBar", () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it("should create a new status bar item if it does not exist", async () => {
		await showStatusBar()
		expect(vscode.window.createStatusBarItem).toHaveBeenCalledTimes(1)
	})

	it("should dispose the existing status bar item if it exists", async () => {
		await showStatusBar()
		const disposeMock = vscode.window.createStatusBarItem().dispose
		await showStatusBar()
		expect(disposeMock).toHaveBeenCalled()
	})

	it("should do nothing if sourceLanguageTag is not available", async () => {
		// @ts-expect-error
		vi.mocked(state).mockReturnValueOnce({ project: undefined })
		await showStatusBar()
		expect(vscode.window.createStatusBarItem).not.toHaveBeenCalled()
	})

	it("should handle the case when previewLanguageTag is not available", async () => {
		vi.mocked(getSetting).mockResolvedValueOnce("")
		await showStatusBar()
		expect(vscode.window.createStatusBarItem).toHaveBeenCalledTimes(1)
	})
})
