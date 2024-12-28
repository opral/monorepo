import { describe, it, beforeEach, expect, vi } from "vitest"
import { createMessageCommand } from "./createMessage.js"
import { msg } from "../utilities/messages/msg.js"
import { window } from "vscode"
import { CONFIGURATION } from "../configuration.js"
import { getSetting } from "../utilities/settings/index.js"
import { telemetry } from "../services/telemetry/index.js"
import { humanId } from "@inlang/sdk"
import { state } from "../utilities/state.js"

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

vi.mock("../services/telemetry/index.js", () => ({
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

vi.mock("@inlang/sdk", () => ({
	humanId: vi.fn().mockReturnValue("randomBundleId123"),
	createMessage: vi.fn(),
}))

vi.mock("../utilities/state", () => ({
	state: vi.fn(),
}))

describe("createMessageCommand", () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it("should return if message content input is cancelled", async () => {
		vi.mocked(state).mockReturnValue({
			project: {
				// @ts-expect-error
				settings: {
					get: vi.fn().mockResolvedValueOnce({ baseLocale: "en" }),
				},
			},
		})

		// @ts-expect-error
		window.showInputBox.mockResolvedValueOnce(undefined)
		await createMessageCommand.callback()
		expect(window.showInputBox).toHaveBeenCalledWith({
			title: "Enter the message content:",
		})
		expect(msg).not.toHaveBeenCalled()
	})

	it("should handle message ID input cancellation", async () => {
		vi.mocked(state).mockReturnValue({
			project: {
				// @ts-expect-error
				settings: {
					get: vi.fn().mockResolvedValueOnce({ baseLocale: "de" }),
				},
			},
		})

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
		vi.mocked(state).mockReturnValue({
			project: {
				// @ts-expect-error
				settings: {
					get: vi.fn().mockResolvedValueOnce({ baseLocale: "en" }),
				},
				db: {
					// @ts-expect-error
					transaction: () => ({
						execute: vi.fn().mockRejectedValueOnce(new Error("Some error")),
					}),
				},
			},
		})

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
		vi.mocked(state).mockReturnValue({
			project: {
				// @ts-expect-error
				settings: {
					get: vi.fn().mockResolvedValueOnce({ baseLocale: "en" }),
				},
				db: {
					// @ts-expect-error
					transaction: () => ({
						execute: vi.fn().mockResolvedValueOnce(true),
					}),
				},
			},
		})

		// @ts-expect-error
		window.showInputBox.mockResolvedValueOnce("Some message content")
		// @ts-expect-error
		window.showInputBox.mockResolvedValueOnce("messageId123")

		await createMessageCommand.callback()

		expect(CONFIGURATION.EVENTS.ON_DID_CREATE_MESSAGE.fire).toHaveBeenCalled()
		expect(telemetry.capture).toHaveBeenCalled()
		expect(msg).toHaveBeenCalledWith("Message created.")
	})

	it("should use humanId as default messageId if autoHumanId is true", async () => {
		vi.mocked(state).mockReturnValue({
			project: {
				// @ts-expect-error
				settings: {
					get: vi.fn().mockResolvedValueOnce({ baseLocale: "en" }),
				},
			},
		})
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

	it("should not use humanId as default messageId if autoHumanId is false", async () => {
		vi.mocked(state).mockReturnValue({
			project: {
				// @ts-expect-error
				settings: {
					get: vi.fn().mockResolvedValueOnce({ baseLocale: "en" }),
				},
			},
		})

		// @ts-expect-error
		getSetting.mockResolvedValueOnce(false)

		// @ts-expect-error
		window.showInputBox.mockResolvedValueOnce("Some message content")

		await createMessageCommand.callback()

		expect(humanId).not.toHaveBeenCalled()

		expect(window.showInputBox).toHaveBeenCalledWith({
			title: "Enter the ID:",
			value: "",
			prompt: undefined,
		})

		expect(window.showInputBox).toHaveBeenCalledWith({
			title: "Enter the message content:",
		})
	})
})
