import { describe, it, expect, vi, beforeEach } from "vitest"
import { state } from "../utilities/state.js"
import { rpc } from "@inlang/rpc"
import { CONFIGURATION } from "../configuration.js"
import { machineTranslateMessageCommand } from "./machineTranslate.js"

vi.mock("vscode", () => ({
	commands: {
		registerCommand: vi.fn(),
	},
	StatusBarAlignment: {
		Left: 1,
		Right: 2,
	},
	window: {
		createStatusBarItem: () => ({
			show: vi.fn(),
			text: "",
			command: "",
			tooltip: "",
		}),
	},
}))
vi.mock("@inlang/rpc", () => ({
	rpc: {
		machineTranslateMessage: vi.fn(),
	},
}))
// Mock the state object structure
const mockState = {
	project: {
		query: {
			messages: {
				get: vi.fn(),
				upsert: vi.fn(),
			},
		},
	},
}

vi.mock("../utilities/state.js", () => {
	return {
		state: () => mockState,
	}
})
vi.mock("../configuration.js", () => ({
	CONFIGURATION: {
		EVENTS: {
			ON_DID_EDIT_MESSAGE: { fire: vi.fn() },
		},
	},
}))

describe("machineTranslateMessageCommand", () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it("should return a not found message if the message does not exist", async () => {
		// @ts-expect-error
		state().project.query.messages.get.mockReturnValue(undefined)
		const result = await machineTranslateMessageCommand.callback({
			messageId: "123",
			sourceLanguageTag: "en",
			targetLanguageTags: ["es"],
		})
		expect(result).toBe("Message with id 123 not found.")
	})

	it("should return an error message if the RPC call fails", async () => {
		// @ts-expect-error
		state().project.query.messages.get.mockReturnValue({ id: "123", content: "Hello" })
		// @ts-expect-error
		rpc.machineTranslateMessage.mockRejectedValue(new Error("RPC error"))
		const result = await machineTranslateMessageCommand.callback({
			messageId: "123",
			sourceLanguageTag: "en",
			targetLanguageTags: ["es"],
		})
		expect(result).toBe("Error translating message: RPC error")
	})

	it("should return a message if no translation is available", async () => {
		// @ts-expect-error
		state().project.query.messages.get.mockReturnValue({ id: "123", content: "Hello" })
		// @ts-expect-error
		rpc.machineTranslateMessage.mockResolvedValue({ data: undefined })
		const result = await machineTranslateMessageCommand.callback({
			messageId: "123",
			sourceLanguageTag: "en",
			targetLanguageTags: ["es"],
		})
		expect(result).toBe("No translation available.")
	})

	it("should handle successful translation and upserting of the message", async () => {
		const mockMessage = { id: "123", content: "Hello" }
		// @ts-expect-error
		state().project.query.messages.get.mockReturnValue(mockMessage)
		// @ts-expect-error
		rpc.machineTranslateMessage.mockResolvedValue({ data: { id: "123", content: "Hola" } })
		const result = await machineTranslateMessageCommand.callback({
			messageId: "123",
			sourceLanguageTag: "en",
			targetLanguageTags: ["es"],
		})
		expect(state().project.query.messages.upsert).toHaveBeenCalledWith({
			where: { id: "123" },
			data: { id: "123", content: "Hola" },
		})
		expect(CONFIGURATION.EVENTS.ON_DID_EDIT_MESSAGE.fire).toHaveBeenCalled()
		expect(result).toBe("Message translated.")
	})
})
