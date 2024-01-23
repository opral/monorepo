import { beforeEach, describe, expect, it, vi } from "vitest"
import { commands, window } from "vscode"
import { state } from "../utilities/state.js"
import { msg } from "../utilities/messages/msg.js"
import { CONFIGURATION } from "../configuration.js"
import type { Message } from "@inlang/sdk"
import { editMessageCommand } from "./editMessage.js"

vi.mock("vscode", () => ({
	commands: {
		registerCommand: vi.fn(),
	},
	window: {
		showInputBox: vi.fn(),
	},
}))

vi.mock("../utilities/state.js", () => ({
	state: vi.fn(),
}))

vi.mock("../utilities/messages/msg.js", () => ({
	msg: vi.fn(),
}))

vi.mock("../configuration.js", () => ({
	CONFIGURATION: {
		EVENTS: {
			ON_DID_EDIT_MESSAGE: { fire: vi.fn() },
		},
	},
}))

describe("editMessageCommand", () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it("should register the command correctly", () => {
		editMessageCommand.register(editMessageCommand.command, editMessageCommand.callback)
		expect(commands.registerCommand).toHaveBeenCalledWith(
			editMessageCommand.command,
			expect.any(Function)
		)
	})

	it("should edit a message", async () => {
		const mockMessageId = "testMessageId"
		const mockLanguageTag = "en"
		const mockMessage: Message = {
			id: mockMessageId,
			selectors: [],
			variants: [
				{
					languageTag: mockLanguageTag,
					match: [],
					pattern: [{ type: "Text", value: "Test Message" }],
				},
			],
		}

		vi.mocked(state).mockReturnValue({
			project: {
				query: {
					messages: {
						// @ts-expect-error
						get: vi.fn().mockReturnValue(mockMessage),
						upsert: vi.fn(),
					},
				},
			},
		})

		vi.mocked(window.showInputBox).mockResolvedValue("New Message")

		await editMessageCommand.callback({ messageId: mockMessageId, languageTag: mockLanguageTag })

		expect(window.showInputBox).toHaveBeenCalled()
		expect(state().project.query.messages.upsert).toHaveBeenCalledWith({
			where: { id: mockMessageId },
			data: mockMessage,
		})
		expect(CONFIGURATION.EVENTS.ON_DID_EDIT_MESSAGE.fire).toHaveBeenCalled()
		expect(msg).toHaveBeenCalledWith("Message updated.")
	})

	it("should show error if message not found", async () => {
		const mockMessageId = "testMessageId"
		const mockLanguageTag = "en"

		vi.mocked(state).mockReturnValue({
			project: {
				query: {
					messages: {
						// @ts-expect-error
						get: vi.fn().mockReturnValue(undefined),
					},
				},
			},
		})

		await editMessageCommand.callback({ messageId: mockMessageId, languageTag: mockLanguageTag })

		expect(msg).toHaveBeenCalledWith(`Message with id ${mockMessageId} not found.`)
	})

	it("should do nothing if new value is empty", async () => {
		const mockMessageId = "testMessageId"
		const mockLanguageTag = "en"
		const mockMessage: Message = {
			id: mockMessageId,
			selectors: [],
			variants: [
				{
					languageTag: mockLanguageTag,
					match: [],
					pattern: [{ type: "Text", value: "Test Message" }],
				},
			],
		}

		// Set up the state mock for this specific test
		vi.mocked(state).mockReturnValue({
			project: {
				query: {
					messages: {
						// @ts-expect-error
						get: vi.fn().mockReturnValue(mockMessage),
						upsert: vi.fn(), // Explicitly mock upsert here
					},
				},
			},
		})

		vi.mocked(window.showInputBox).mockResolvedValue(undefined)

		await editMessageCommand.callback({ messageId: mockMessageId, languageTag: mockLanguageTag })

		expect(window.showInputBox).toHaveBeenCalled()
		expect(state().project.query.messages.upsert).not.toHaveBeenCalled()
	})
})
