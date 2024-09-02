import { describe, it, beforeEach, expect, vi } from "vitest"
import { extractMessageCommand } from "./extractMessage.js"
import { msg } from "../utilities/messages/msg.js"
import { window } from "vscode"
import { CONFIGURATION } from "../configuration.js"
import { getSetting } from "../utilities/settings/index.js"
import { state } from "../utilities/state.js"

// Mocking the necessary modules
vi.mock("../utilities/state", () => ({
	state: vi.fn(),
}))

vi.mock("vscode", () => ({
	window: {
		showInputBox: vi.fn(),
		showQuickPick: vi.fn(),
		showErrorMessage: vi.fn(),
	},
	commands: {
		registerTextEditorCommand: vi.fn(),
	},
}))

vi.mock("../utilities/messages/msg", () => ({
	msg: vi.fn(),
}))

vi.mock("../services/telemetry/index.js", () => ({
	telemetry: {
		capture: vi.fn(),
	},
}))

vi.mock("../configuration", () => ({
	CONFIGURATION: {
		EVENTS: {
			ON_DID_EXTRACT_MESSAGE: {
				fire: vi.fn(),
			},
		},
	},
}))

vi.mock("../utilities/settings/index.js", () => ({
	getSetting: vi.fn(),
}))

vi.mock("@inlang/sdk2", () => ({
	generateBundleId: vi.fn().mockReturnValue("generatedId123"),
	createBundle: vi.fn().mockReturnValue({ id: "generatedId123", alias: "alias123" }),
	createMessage: vi.fn().mockReturnValue({ id: "messageId123", bundleId: "generatedId123" }),
}))

vi.mock("../utilities/messages/isQuoted", () => ({
	isQuoted: vi.fn(),
	stripQuotes: vi.fn(),
}))

describe("extractMessageCommand", () => {
	let mockTextEditor: any

	beforeEach(() => {
		vi.clearAllMocks()
		mockTextEditor = {
			document: {
				getText: vi.fn().mockReturnValue("Sample Text"),
			},
			selection: {
				isEmpty: false,
			},
			edit: vi.fn().mockResolvedValue(true),
		}
		vi.mocked(state).mockReturnValue({
			project: {
				plugins: {
					subscribe: vi.fn(),
					get: async () => [
						{
							key: "plugin1",
							meta: {
								"app.inlang.ideExtension": {
									extractMessageOptions: [
										{
											callback: vi.fn(() => ({
												messageId: "messageId123",
												messageReplacement: "Replacement Text",
											})),
										},
									],
								},
							},
						},
					],
				},
				settings: {
					subscribe: vi.fn(),
					set: vi.fn(),
					get: async () => ({ baseLocale: "en", locales: ["en"] }),
				},
				db: {
					// @ts-expect-error
					transaction: () => ({
						execute: vi.fn(),
					}),
				},
			},
		})
	})

	it("should show warning if ideExtension is not configured", async () => {
		vi.mocked(state).mockReturnValueOnce({
			project: {
				plugins: {
					subscribe: vi.fn(),
					get: async () => [
						{
							key: "plugin1",
							meta: {},
						},
					],
				},
				// @ts-expect-error
				settings: {
					get: async () => ({ baseLocale: "en", locales: ["en"] }),
				},
			},
		})

		await extractMessageCommand.callback(mockTextEditor)
		expect(msg).toHaveBeenCalledWith(
			"There is no `plugin` configuration for the Visual Studio Code extension (Sherlock). One of the `modules` should expose a `plugin` which has `customApi` containing `app.inlang.ideExtension`",
			"warn",
			"notification"
		)
	})

	it("should show warning if extractMessageOptions is not defined", async () => {
		vi.mocked(state).mockReturnValueOnce({
			project: {
				plugins: {
					subscribe: vi.fn(),
					get: async () => [
						{
							key: "plugin1",
							meta: {
								"app.inlang.ideExtension": {},
							},
						},
					],
				},
				// @ts-expect-error
				settings: {
					get: async () => ({ baseLocale: "en", locales: ["en"] }),
				},
			},
		})

		await extractMessageCommand.callback(mockTextEditor)
		expect(msg).toHaveBeenCalledWith(
			"The `extractMessageOptions` are not defined in `app.inlang.ideExtension` but required to extract a message.",
			"warn",
			"notification"
		)
	})

	it("should show warning if no active text editor is found", async () => {
		await extractMessageCommand.callback(undefined)
		expect(msg).toHaveBeenCalledWith(
			"No active text editor found. Please open a file in the editor to extract a message.",
			"warn",
			"notification"
		)
	})

	it("should show warning if no text is selected", async () => {
		mockTextEditor.selection.isEmpty = true

		await extractMessageCommand.callback(mockTextEditor)
		expect(msg).toHaveBeenCalledWith(
			"Please select a text to extract in your text editor.",
			"warn",
			"notification"
		)
	})

	it("should cancel operation if messageId is not provided", async () => {
		vi.mocked(getSetting).mockResolvedValueOnce(true)
		vi.mocked(window.showInputBox).mockResolvedValueOnce(undefined)

		await extractMessageCommand.callback(mockTextEditor)
		expect(window.showQuickPick).not.toHaveBeenCalled()
	})

	it("should handle non-existent extract option", async () => {
		console.log("Starting test: should handle non-existent extract option")

		vi.mocked(getSetting).mockResolvedValueOnce(true)
		vi.mocked(window.showInputBox).mockResolvedValueOnce("generatedId123")
		vi.mocked(window.showQuickPick).mockResolvedValueOnce(undefined)

		await extractMessageCommand.callback(mockTextEditor)

		console.log("Completed callback execution")
		console.log("msg.calls:", msg.mock.calls)

		expect(msg).toHaveBeenCalledWith(
			"Couldn't find choosen extract option.",
			"warn",
			"notification"
		)

		console.log("Test completed: should handle non-existent extract option")
	})

	it("should show error message if message creation fails", async () => {
		console.log("Starting test: should show error message if message creation fails")

		vi.mocked(getSetting).mockResolvedValueOnce(true)
		vi.mocked(window.showInputBox).mockResolvedValueOnce("generatedId123")
		// @ts-expect-error
		vi.mocked(window.showQuickPick).mockResolvedValueOnce("Replacement Text")

		vi.mocked(state).mockReturnValueOnce({
			project: {
				plugins: {
					subscribe: vi.fn(),
					get: async () => [
						{
							key: "plugin1",
							meta: {
								"app.inlang.ideExtension": {
									extractMessageOptions: [
										{
											callback: vi.fn(() => ({
												messageId: "messageId123",
												messageReplacement: "Replacement Text",
											})),
										},
									],
								},
							},
						},
					],
				},
				// @ts-expect-error
				settings: {
					get: async () => ({ baseLocale: "en", locales: ["en"] }),
				},
				db: {
					// @ts-expect-error
					transaction: () => ({
						execute: vi.fn().mockRejectedValue(new Error("Some error")),
					}),
				},
			},
		})

		try {
			await extractMessageCommand.callback(mockTextEditor)
		} catch (e) {
			console.error("Caught an error in callback execution:", e)
		}

		console.log("Completed callback execution")
		console.log("window.showErrorMessage.calls:", window.showErrorMessage.mock.calls)

		expect(window.showErrorMessage).toHaveBeenCalledWith(
			`Couldn't extract new message with id generatedId123.`
		)

		console.log("Test completed: should show error message if message creation fails")
	})

	it("should extract a message successfully", async () => {
		vi.mocked(getSetting).mockResolvedValueOnce(true)
		vi.mocked(window.showInputBox).mockResolvedValueOnce("generatedId123")
		// @ts-expect-error
		vi.mocked(window.showQuickPick).mockResolvedValueOnce("Replacement Text")

		await extractMessageCommand.callback(mockTextEditor)

		expect(window.showInputBox).toHaveBeenCalled()
		expect(window.showQuickPick).toHaveBeenCalled()
		expect(mockTextEditor.edit).toHaveBeenCalled()
		expect(CONFIGURATION.EVENTS.ON_DID_EXTRACT_MESSAGE.fire).toHaveBeenCalled()
		expect(msg).toHaveBeenCalledWith("Message extracted.")
	})
})
