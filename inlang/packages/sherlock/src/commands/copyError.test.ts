import { beforeEach, describe, expect, it, vi } from "vitest"
import * as vscode from "vscode"
import type { ErrorNode } from "../utilities/errors/errors.js"
import { copyErrorCommand } from "./copyError.js"
import { msg } from "../utilities/messages/msg.js"

vi.mock("vscode", () => ({
	window: {
		createOutputChannel: vi.fn(),
	},
	env: {
		clipboard: {
			writeText: vi.fn(),
		},
	},
	commands: {
		registerCommand: vi.fn(),
	},
}))

vi.mock("../utilities/messages/msg.js", () => ({
	msg: vi.fn(),
}))

describe("copyErrorCommand", () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it("should register the command correctly", () => {
		copyErrorCommand.register(copyErrorCommand.command, copyErrorCommand.callback)
		expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
			copyErrorCommand.command,
			expect.any(Function)
		)
	})

	it("should copy error to clipboard and show message", async () => {
		const mockError: ErrorNode = {
			label: "Test Error",
			tooltip: "This is a test error",
			error: new Error("This is a test error"),
			// Other properties of ErrorNode if necessary
		}

		await copyErrorCommand.callback(mockError)

		expect(vscode.env.clipboard.writeText).toHaveBeenCalledWith("Test Error: This is a test error")
		expect(msg).toHaveBeenCalledWith("$(check) Copied", "info", "statusBar")
	})
})
