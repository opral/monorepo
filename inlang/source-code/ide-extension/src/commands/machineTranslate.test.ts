import { describe, it, expect, vi, beforeEach } from "vitest"
import { rpc } from "@inlang/rpc"
import { CONFIGURATION } from "../configuration.js"
import { machineTranslateMessageCommand } from "./machineTranslate.js"
import { msg } from "../utilities/messages/msg.js"

vi.mock("vscode", () => ({
	commands: {
		registerCommand: vi.fn(),
	},
	StatusBarAlignment: {
		Left: 1,
		Right: 2,
	},
	window: {
		createStatusBarItem: vi.fn(() => ({
			show: vi.fn(),
			text: "",
		})),
	},
}))

vi.mock("@inlang/rpc", () => ({
	rpc: {
		machineTranslateMessage: vi.fn(),
	},
}))

vi.mock("../configuration", () => ({
	CONFIGURATION: {
		EVENTS: {
			ON_DID_EDIT_MESSAGE: {
				fire: vi.fn(),
			},
		},
	},
}))

vi.mock("../utilities/messages/msg", () => ({
	msg: vi.fn(),
}))

vi.mock("../utilities/state", () => ({
	state: () => ({
		project: {
			query: {
				messages: {
					get: (args: any) => {
						if (args.where && args.where.id === "validId") {
							return mockMessage
						}
						return undefined
					},
					upsert: vi.fn(),
				},
			},
		},
	}),
}))

const mockMessage = {
	id: "validId",
	alias: {},
	selectors: [],
	variants: [
		{
			languageTag: "en",
			match: [],
			pattern: [
				{
					type: "Text",
					value: "Original content",
				},
			],
		},
	],
}

describe("machineTranslateMessageCommand", () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it("should return a message if messageId is not found", async () => {
		await machineTranslateMessageCommand.callback({
			bundleId: "nonexistent",
			baseLocale: "en",
			targetLocales: ["es"],
		})

		expect(msg).toHaveBeenCalledWith("Message with id nonexistent not found.")
	})

	it("should return an error message on RPC error", async () => {
		// @ts-expect-error
		rpc.machineTranslateMessage.mockResolvedValueOnce({ error: "RPC Error" })

		await machineTranslateMessageCommand.callback({
			bundleId: "validId",
			baseLocale: "en",
			targetLocales: ["es"],
		})

		expect(msg).toHaveBeenCalledWith("Error translating message: RPC Error")
	})

	it("should return a message if no translation is available", async () => {
		// @ts-expect-error
		rpc.machineTranslateMessage.mockResolvedValueOnce({ data: undefined })

		await machineTranslateMessageCommand.callback({
			bundleId: "validId",
			baseLocale: "en",
			targetLocales: ["es"],
		})

		expect(msg).toHaveBeenCalledWith("No translation available.")
	})

	it("should successfully translate and update a message", async () => {
		const mockTranslation = { translatedText: "Translated content" }
		// @ts-expect-error
		rpc.machineTranslateMessage.mockResolvedValueOnce({ data: mockTranslation })

		await machineTranslateMessageCommand.callback({
			bundleId: "validId",
			baseLocale: "en",
			targetLocales: ["es"],
		})

		expect(msg).toHaveBeenCalledWith("Message translated.")
	})

	it("should emit ON_DID_EDIT_MESSAGE event after successful translation", async () => {
		const mockTranslation = { translatedText: "Translated content" }
		// @ts-expect-error
		rpc.machineTranslateMessage.mockResolvedValueOnce({ data: mockTranslation })

		await machineTranslateMessageCommand.callback({
			bundleId: "validId",
			baseLocale: "en",
			targetLocales: ["es"],
		})

		expect(CONFIGURATION.EVENTS.ON_DID_EDIT_MESSAGE.fire).toHaveBeenCalled()
	})
})
