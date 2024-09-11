// jumpToPositionCommand.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest"
import * as vscode from "vscode"
import { jumpToPositionCommand } from "./jumpToPosition.js"
import * as telemetry from "../services/telemetry/index.js"

vi.mock("vscode", () => ({
	commands: {
		registerCommand: vi.fn(),
	},
	window: {
		activeTextEditor: undefined,
	},
	workspace: {
		getConfiguration: vi.fn(() => ({
			get: vi.fn(),
		})),
	},
	Position: vi.fn((line, character) => ({ line, character })),
	Range: vi.fn(),
	TextEditorRevealType: {
		InCenterIfOutsideViewport: {},
	},
	Selection: vi.fn(),
}))

vi.mock("../services/telemetry/implementation.js", () => ({
	telemetry: {
		capture: vi.fn(),
	},
}))

describe("jumpToPositionCommand", () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it("should register the command correctly", () => {
		jumpToPositionCommand.register(jumpToPositionCommand.command, jumpToPositionCommand.callback)

		expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
			jumpToPositionCommand.command,
			expect.any(Function)
		)
	})

	it("should not execute if no active editor", async () => {
		const captureSpy = vi.spyOn(telemetry, "capture")

		await jumpToPositionCommand.callback({
			bundleId: "test-message",
			position: { start: { line: 1, character: 5 }, end: { line: 1, character: 10 } },
		})
		expect(vscode.window.activeTextEditor).toBeUndefined()
		expect(captureSpy).not.toHaveBeenCalled()
	})

	it("should set editor selection and reveal range when editor is active", async () => {
		const captureSpy = vi.spyOn(telemetry, "capture")
		// Mock an active editor
		vscode.window.activeTextEditor = {
			selection: {} as vscode.Selection,
			revealRange: vi.fn(),
			// @ts-expect-error
			document: {
				uri: { fsPath: "/path/to/file" } as vscode.Uri,
			},
		}

		const args = {
			bundleId: "test-message",
			position: { start: { line: 1, character: 5 }, end: { line: 1, character: 10 } },
		}

		await jumpToPositionCommand.callback(args)

		expect(vscode.Position).toHaveBeenCalledTimes(2)
		expect(vscode.Range).toHaveBeenCalled()
		expect(vscode.window.activeTextEditor?.revealRange).toHaveBeenCalled()
		expect(captureSpy).toHaveBeenCalledWith({
			event: "IDE-EXTENSION jumped to position in editor",
		})
	})
})
