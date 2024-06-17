import { describe, it, beforeEach, afterEach, vi, expect } from "vitest"
import { createMessageCommand } from "./createMessage.js"
import { state } from "../utilities/state.js"
import { msg } from "../utilities/messages/msg.js"
import { window } from "vscode"
import { telemetry } from "../services/telemetry/index.js"
import { CONFIGURATION } from "../configuration.js"

vi.mock("vscode", () => ({
	commands: {
		registerCommand: vi.fn(),
	},
	window: {
		showInputBox: vi.fn(),
		showErrorMessage: vi.fn(),
	},
}))

vi.mock("../utilities/state", () => ({
	state: vi.fn(),
}))

vi.mock("../utilities/messages/msg", () => ({
	msg: vi.fn(),
}))

vi.mock("../services/telemetry/index", () => ({
	telemetry: {
		capture: vi.fn(),
	},
}))

vi.mock("../configuration", () => ({
	CONFIGURATION: {
		EVENTS: {
			ON_DID_CREATE_MESSAGE: {
				fire: vi.fn(),
			},
		},
	},
}))

describe("createMessageCommand", () => {
	const mockState = {
		project: {
			settings: vi.fn().mockReturnThis(),
			customApi: vi.fn().mockReturnThis(),
			query: {
				messages: {
					create: vi.fn(),
				},
			},
		},
	}

	beforeEach(() => {
		vi.resetAllMocks()
		// @ts-expect-error
		state.mockReturnValue(mockState)
	})

	afterEach(() => {
		vi.restoreAllMocks()
	})

	it("should warn if sourceLanguageTag is undefined", async () => {
		mockState.project.settings.mockReturnValueOnce({ sourceLanguageTag: undefined })

		await createMessageCommand.callback()

		expect(msg).toHaveBeenCalledWith(
			"The `sourceLanguageTag` is not defined in the project but required to create a message.",
			"warn",
			"notification"
		)
	})

	it("should return if message content input is cancelled", async () => {
		mockState.project.settings.mockReturnValueOnce({ sourceLanguageTag: "en" })
		// @ts-expect-error
		window.showInputBox.mockResolvedValueOnce(undefined)

		await createMessageCommand.callback()

		expect(window.showInputBox).toHaveBeenCalledWith({
			title: "Enter the message content:",
		})
		expect(msg).not.toHaveBeenCalled()
	})

	it("should return if message ID input is cancelled", async () => {
		mockState.project.settings.mockReturnValueOnce({ sourceLanguageTag: "en" })
		// @ts-expect-error
		window.showInputBox.mockResolvedValueOnce("Message content")
		// @ts-expect-error
		window.showInputBox.mockResolvedValueOnce(undefined)

		await createMessageCommand.callback()

		expect(window.showInputBox).toHaveBeenCalledWith({
			title: "Enter the message content:",
		})
		expect(msg).not.toHaveBeenCalled()
	})

	it("should show error message if message creation fails", async () => {
		mockState.project.settings.mockReturnValueOnce({ sourceLanguageTag: "en" })
		// @ts-expect-error
		window.showInputBox.mockResolvedValueOnce("Message content")
		// @ts-expect-error
		window.showInputBox.mockResolvedValueOnce("messageId")
		mockState.project.query.messages.create.mockReturnValueOnce(false)

		await createMessageCommand.callback()

		expect(window.showErrorMessage).toHaveBeenCalledWith(
			"Couldn't upsert new message with id messageId."
		)
	})

	it("should create message and show success message", async () => {
		mockState.project.settings.mockReturnValueOnce({ sourceLanguageTag: "en" })
		// @ts-expect-error
		window.showInputBox.mockResolvedValueOnce("Message content")
		// @ts-expect-error
		window.showInputBox.mockResolvedValueOnce("messageId")
		mockState.project.query.messages.create.mockReturnValueOnce(true)

		await createMessageCommand.callback()

		expect(mockState.project.query.messages.create).toHaveBeenCalledWith({
			data: {
				id: "messageId",
				alias: {},
				selectors: [],
				variants: [
					{
						languageTag: "en",
						match: [],
						pattern: [
							{
								type: "Text",
								value: "Message content",
							},
						],
					},
				],
			},
		})
		expect(CONFIGURATION.EVENTS.ON_DID_CREATE_MESSAGE.fire).toHaveBeenCalled()
		expect(telemetry.capture).toHaveBeenCalledWith({
			event: "IDE-EXTENSION command executed: Create Message",
		})
		expect(msg).toHaveBeenCalledWith("Message created.")
	})
})
