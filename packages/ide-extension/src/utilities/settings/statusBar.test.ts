import { describe, it, expect, vi } from "vitest"
import * as vscode from "vscode"
import { getSetting } from "./index.js"
import { showStatusBar } from "./statusBar.js"

// Mock for statusBar
const mockStatusBar = {
	text: "",
	show: vi.fn(),
	dispose: vi.fn(),
	command: "",
}

// Mock for vscode module
vi.mock("vscode", () => ({
	window: { createStatusBarItem: vi.fn(() => mockStatusBar) },
	StatusBarAlignment: { Right: 1 },
}))

// Other mocks
vi.mock("../state.js", () => ({
	state: () => ({
		project: {
			settings: () => ({
				sourceLanguageTag: "en",
			}),
		},
	}),
}))
vi.mock("./index.js", () => ({ getSetting: vi.fn() }))

describe("showStatusBar", () => {
	it("should create and show status bar with previewLanguageTag", async () => {
		vi.mocked(getSetting).mockResolvedValue("es")
		await showStatusBar()

		expect(vi.mocked(vscode.window.createStatusBarItem)).toHaveBeenCalledWith(
			vscode.StatusBarAlignment.Right,
			100
		)
		expect(mockStatusBar.text).toBe("Inlang: es")
		expect(mockStatusBar.command).toBe("inlang.previewLanguageTag")
	})

	it("should create and show status bar with sourceLanguageTag when previewLanguageTag is not set", async () => {
		vi.mocked(getSetting).mockResolvedValue("")
		await showStatusBar()

		expect(vi.mocked(vscode.window.createStatusBarItem)).toHaveBeenCalledWith(
			vscode.StatusBarAlignment.Right,
			100
		)
		expect(mockStatusBar.text).toBe("Inlang: en")
		expect(mockStatusBar.command).toBe("inlang.previewLanguageTag")
	})
})
