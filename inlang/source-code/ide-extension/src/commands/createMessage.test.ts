import { describe, it, beforeEach, expect, vi } from "vitest"
import { createMessageCommand } from "./createMessage.js"
import { msg } from "../utilities/messages/msg.js"
import { window } from "vscode"
import { CONFIGURATION } from "../configuration.js"
import { getSetting } from "../utilities/settings/index.js"
import { telemetry } from "../services/telemetry/implementation.js"
import { humanId } from "@inlang/sdk2"

vi.mock("vscode", () => ({
	window: {
		showInputBox: vi.fn(),
		showErrorMessage: vi.fn(),
	},
	commands: {
		executeCommand: vi.fn(),
	},
	EventEmitter: vi.fn(),
}))

vi.mock("../utilities/messages/msg", () => ({
	msg: vi.fn(),
}))

vi.mock("../services/telemetry", () => ({
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

vi.mock("../utilities/settings", () => ({
	getSetting: vi.fn().mockResolvedValue(false),
}))

vi.mock("@inlang/sdk2", () => ({
	humanId: vi.fn().mockReturnValue("randomBundleId123"),
	createMessage: vi.fn(),
}))

describe("createMessageCommand", () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it("should return if message content input is cancelled", async () => {
		vi.mock("../utilities/state", () => ({
			state: () => ({
				project: {
					settings: {
						get: vi.fn().mockResolvedValueOnce({ baseLocale: "en" }),
					},
				},
			}),
		}))
		// @ts-expect-error
		window.showInputBox.mockResolvedValueOnce(undefined)
		await createMessageCommand.callback()
		expect(window.showInputBox).toHaveBeenCalledWith({
			title: "Enter the message content:",
		})
		expect(msg).not.toHaveBeenCalled()
	})

	it("should handle message ID input cancellation", async () => {
		vi.mock("../utilities/state", () => ({
			state: () => ({
				project: {
					settings: {
						get: vi.fn().mockResolvedValueOnce({ baseLocale: "en" }),
					},
				},
			}),
		}))
		// @ts-expect-error
		window.showInputBox.mockResolvedValueOnce("Some message content")
		// @ts-expect-error
		window.showInputBox.mockResolvedValueOnce(undefined)
		await createMessageCommand.callback()
		expect(window.showInputBox).toHaveBeenCalledTimes(2)
		expect(msg).not.toHaveBeenCalled()
	})

	it("should show error message if message creation fails", async () => {
		// Mock state with proper transaction rejection
		vi.mock("../utilities/state", () => ({
			state: () => ({
				project: {
					settings: {
						get: vi.fn().mockResolvedValueOnce({ baseLocale: "en" }),
					},
					db: {
						transaction: () => ({
							execute: vi.fn().mockRejectedValueOnce("Some error"),
						}),
					},
				},
			}),
		}))

		// @ts-expect-error
		window.showInputBox.mockResolvedValueOnce("Some message content")
		// @ts-expect-error
		window.showInputBox.mockResolvedValueOnce("messageId123")

		await createMessageCommand.callback()

		expect(window.showErrorMessage).toHaveBeenCalledWith(
			"Couldn't upsert new message. Error: Some error"
		)
	})

	it("should create message and show success message", async () => {
		// Mock state with proper transaction rejection
		vi.mock("../utilities/state", () => ({
			state: () => ({
				project: {
					settings: {
						get: vi.fn().mockResolvedValueOnce({ baseLocale: "en" }),
					},
					db: {
						transaction: () => ({
							execute: vi.fn().mockResolvedValueOnce(true),
						}),
					},
				},
			}),
		}))

		// @ts-expect-error
		window.showInputBox.mockResolvedValueOnce("Some message content")
		// @ts-expect-error
		window.showInputBox.mockResolvedValueOnce("messageId123")

		await createMessageCommand.callback()

		expect(CONFIGURATION.EVENTS.ON_DID_CREATE_MESSAGE.fire).toHaveBeenCalled()
		expect(telemetry.capture).toHaveBeenCalled()
		expect(msg).toHaveBeenCalledWith("Message created.")
	})

	it("should use generateBundleId as default messageId if autoHumanId is true", async () => {
		vi.mock("../utilities/state", () => ({
			state: () => ({
				project: {
					settings: {
						get: vi.fn().mockResolvedValueOnce({ baseLocale: "en" }),
					},
				},
			}),
		}))
		// @ts-expect-error
		getSetting.mockResolvedValueOnce(true)
		// @ts-expect-error
		window.showInputBox.mockResolvedValueOnce("Some message content")
		await createMessageCommand.callback()
		expect(humanId).toHaveBeenCalled()
		expect(window.showInputBox).toHaveBeenCalledWith({
			title: "Enter the ID:",
			value: "randomBundleId123",
			prompt:
				"Tip: It's best practice to use random names for your messages. Read this [guide](https://inlang.com/documentation/concept/message#idhuman-readable) for more information.",
		})
	})

	it("should not use generateBundleId as default messageId if autoHumanId is false", async () => {
		vi.mock("../utilities/state", () => ({
			state: () => ({
				project: {
					settings: {
						get: vi.fn().mockResolvedValueOnce({ baseLocale: "en" }),
					},
				},
			}),
		}))
		// @ts-expect-error
		getSetting.mockResolvedValueOnce(false)
		// @ts-expect-error
		window.showInputBox.mockResolvedValueOnce("Some message content")

		await createMessageCommand.callback()

		expect(window.showInputBox).toHaveBeenCalledWith({
			title: "Enter the ID:",
			value: "",
			prompt: undefined,
		})
	})
})
