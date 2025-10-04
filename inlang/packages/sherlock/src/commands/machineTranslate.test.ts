import { describe, it, expect, vi, beforeEach } from "vitest"
import { rpc } from "@inlang/rpc"
import { CONFIGURATION } from "../configuration.js"
import { machineTranslateMessageCommand } from "./machineTranslate.js"
import { msg } from "../utilities/messages/msg.js"
import { selectBundleNested, type BundleNested } from "@inlang/sdk"

vi.mock("vscode", () => ({
	commands: {
		registerCommand: vi.fn(),
	},
	StatusBarAlignment: {
		Left: 1,
		Right: 2,
	},
	window: {
		createOutputChannel: vi.fn(),
		createStatusBarItem: vi.fn(() => ({
			show: vi.fn(),
			text: "",
		})),
	},
}))

vi.mock("@inlang/rpc", () => ({
	rpc: {
		machineTranslateBundle: vi.fn(),
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

vi.mock("../utilities/messages/query.js", () => ({
	getPatternFromString: vi.fn(),
	getStringFromPattern: vi.fn(),
}))

vi.mock("../utilities/state", () => {
	const stateFn = vi.fn(() => ({
		project: {
			db: {},
		},
	}))
	return {
		state: stateFn,
		safeState: stateFn,
	}
})

vi.mock("@inlang/sdk", () => ({
	selectBundleNested: vi.fn(),
}))

const mockBundle: BundleNested = {
	id: "validId",
	declarations: [],
	messages: [
		{
			id: "messageId",
			bundleId: "validId",
			locale: "en",
			selectors: [],
			variants: [
				{
					id: "variantId",
					messageId: "messageId",
					matches: [],
					pattern: [
						{
							type: "text",
							value: "Original content",
						},
					],
				},
			],
		},
	],
}

describe("machineTranslateMessageCommand", () => {
	beforeEach(() => {
		vi.clearAllMocks()
		vi.stubEnv("MOCK_TRANSLATE", "true")
	})

	it("should return a message if bundleId is not found", async () => {
		// @ts-expect-error
		vi.mocked(selectBundleNested).mockReturnValueOnce({
			where: vi.fn().mockReturnThis(),
			executeTakeFirst: vi.fn().mockResolvedValueOnce(undefined),
		})

		await machineTranslateMessageCommand.callback({
			bundleId: "nonexistent",
			baseLocale: "en",
			targetLocales: ["es"],
		})

		expect(msg).toHaveBeenCalledWith("Bundle with id nonexistent not found.")
	})

	it("should return an error message on RPC error", async () => {
		// @ts-expect-error
		vi.mocked(selectBundleNested).mockReturnValueOnce({
			where: vi.fn().mockReturnThis(),
			executeTakeFirst: vi.fn().mockResolvedValueOnce(mockBundle),
		})
		// @ts-expect-error
		rpc.machineTranslateBundle.mockResolvedValueOnce({ error: "RPC Error" })

		await machineTranslateMessageCommand.callback({
			bundleId: "validId",
			baseLocale: "en",
			targetLocales: ["es"],
		})

		expect(msg).toHaveBeenCalledWith("Error translating message: RPC Error")
	})

	it("should return a message if no translation is available", async () => {
		// @ts-expect-error
		vi.mocked(selectBundleNested).mockReturnValueOnce({
			where: vi.fn().mockReturnThis(),
			executeTakeFirst: vi.fn().mockResolvedValueOnce(mockBundle),
		})
		// @ts-expect-error
		rpc.machineTranslateBundle.mockResolvedValueOnce({ data: undefined })

		await machineTranslateMessageCommand.callback({
			bundleId: "validId",
			baseLocale: "en",
			targetLocales: ["es"],
		})

		expect(msg).toHaveBeenCalledWith("No translations available.")
	})

	// TODO: Fix this test
	it.skip("should successfully translate and update a message", async () => {
		// @ts-expect-error
		vi.mocked(selectBundleNested).mockReturnValueOnce({
			where: vi.fn().mockReturnThis(),
			executeTakeFirst: vi.fn().mockResolvedValueOnce(mockBundle),
		})
		const mockTranslation = { translatedText: "Translated content" }
		// @ts-expect-error
		rpc.machineTranslateBundle.mockResolvedValueOnce({ data: mockTranslation })

		await machineTranslateMessageCommand.callback({
			bundleId: "validId",
			baseLocale: "en",
			targetLocales: ["es"],
		})

		expect(msg).toHaveBeenCalledWith("Message translated.")
	})

	// TODO: Fix this test
	it.skip("should emit ON_DID_EDIT_MESSAGE event after successful translation", async () => {
		// @ts-expect-error
		vi.mocked(selectBundleNested).mockReturnValueOnce({
			where: vi.fn().mockReturnThis(),
			executeTakeFirst: vi.fn().mockResolvedValueOnce(mockBundle),
		})
		const mockTranslation = { translatedText: "Translated content" }
		// @ts-expect-error
		rpc.machineTranslateBundle.mockResolvedValueOnce({ data: mockTranslation })

		await machineTranslateMessageCommand.callback({
			bundleId: "validId",
			baseLocale: "en",
			targetLocales: ["es"],
		})

		expect(CONFIGURATION.EVENTS.ON_DID_EDIT_MESSAGE.fire).toHaveBeenCalledWith({
			origin: "command:machineTranslate",
		})
	})
})
