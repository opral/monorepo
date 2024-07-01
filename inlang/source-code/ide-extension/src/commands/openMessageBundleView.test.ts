import { describe, it, expect, vi, beforeEach } from "vitest"
import { openMessageBundleViewCommand } from "./openMessageBundleView.js"
import * as vscode from "vscode"
import * as telemetryModule from "../services/telemetry/implementation.js"
import * as messageModule from "../utilities/messages/messageBundleView.js"

// Mock the vscode module and any other necessary modules
vi.mock("vscode", () => ({
	commands: {
		registerCommand: vi.fn(),
	},
	ExtensionContext: {},
}))

vi.mock("../services/telemetry/implementation.js", () => ({
	telemetry: {
		capture: vi.fn(),
	},
}))

vi.mock("../utilities/messages/messageBundleView.js", () => ({
	messageBundlePanel: vi.fn(),
}))

describe("openMessageBundleViewCommand", () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	const mockContext = vi.mocked({} as vscode.ExtensionContext)

	it("should register the command correctly", () => {
		openMessageBundleViewCommand.register(
			openMessageBundleViewCommand.command,
			openMessageBundleViewCommand.callback
		)

		expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
			"sherlock.openMessageBundleView",
			expect.any(Function)
		)
	})

	it("should open the message bundle panel successfully", async () => {
		const messageBundlePanelMock = vi.mocked(messageModule.messageBundlePanel)
		messageBundlePanelMock.mockResolvedValue(undefined)

		await openMessageBundleViewCommand.callback({ context: mockContext, id: "test-id" })

		expect(messageBundlePanelMock).toHaveBeenCalledWith({ context: mockContext, id: "test-id" })
	})

	it("should capture telemetry when message bundle view is opened", async () => {
		const telemetryCaptureMock = vi.mocked(telemetryModule.telemetry.capture)
		telemetryCaptureMock.mockResolvedValue(undefined)

		await openMessageBundleViewCommand.callback({ context: mockContext, id: "test-id" })

		expect(telemetryCaptureMock).toHaveBeenCalledWith({
			event: "IDE-EXTENSION Message Bundle View opened",
		})
	})

	// Example of handling an error scenario
	it("should handle errors when the message bundle panel fails", async () => {
		const messageBundlePanelMock = vi.mocked(messageModule.messageBundlePanel)
		const error = new Error("Failed to open panel")
		messageBundlePanelMock.mockRejectedValue(error)

		await expect(
			openMessageBundleViewCommand.callback({ context: mockContext, id: "test-id" })
		).rejects.toThrow("Failed to open panel")

		// Optionally verify that no telemetry is captured in case of an error
		expect(telemetryModule.telemetry.capture).not.toHaveBeenCalled()
	})
})
