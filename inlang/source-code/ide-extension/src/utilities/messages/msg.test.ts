import { describe, expect, it, vi } from "vitest"
import * as vscode from "vscode"
import { msg } from "./msg.js"

vi.mock("vscode", () => ({
	window: {
		showErrorMessage: vi.fn(),
		showWarningMessage: vi.fn(),
		showInformationMessage: vi.fn(),
		createStatusBarItem: vi.fn().mockReturnValue({
			show: vi.fn(),
			hide: vi.fn(),
			color: undefined,
			text: "",
		}),
	},
	StatusBarAlignment: {
		Left: 1,
		Right: 2,
	},
	ThemeColor: class ThemeColor {
		constructor(public id: string) {}
	},
}))

describe("msg function", () => {
	it("should display a status bar message with default parameters", () => {
		msg("Test message")
		expect(vscode.window.createStatusBarItem).toHaveBeenCalledWith(
			vscode.StatusBarAlignment.Left,
			1000
		)
		const statusBarItem = vscode.window.createStatusBarItem()
		expect(statusBarItem.text).toBe("Test message")
		expect(statusBarItem.show).toHaveBeenCalled()
	})

	it("should display an error status bar message", () => {
		msg("Error message", "error")
		const statusBarItem = vscode.window.createStatusBarItem()
		expect(statusBarItem.color).toBeInstanceOf(vscode.ThemeColor)
		// @ts-expect-error
		expect(statusBarItem.color.id).toBe("statusBarItem.errorBackground")
	})

	it("should display a warning status bar message", () => {
		msg("Warning message", "warn")
		const statusBarItem = vscode.window.createStatusBarItem()
		expect(statusBarItem.color).toBeInstanceOf(vscode.ThemeColor)
		// @ts-expect-error
		expect(statusBarItem.color.id).toBe("statusBarItem.warningBackground")
	})

	it("should display an error notification", () => {
		msg("Error notification", "error", "notification")
		expect(vscode.window.showErrorMessage).toHaveBeenCalledWith("Error notification")
	})

	it("should display a warning notification", () => {
		msg("Warning notification", "warn", "notification")
		expect(vscode.window.showWarningMessage).toHaveBeenCalledWith("Warning notification")
	})

	it("should display an information notification", () => {
		msg("Information notification", "info", "notification")
		expect(vscode.window.showInformationMessage).toHaveBeenCalledWith("Information notification")
	})
})
