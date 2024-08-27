import { beforeEach, describe, expect, it, vi } from "vitest"
import { window } from "vscode"
import { editMessageCommand } from "./editMessage.js"
import { state } from "../utilities/state.js"
import { msg } from "../utilities/messages/msg.js"
import { CONFIGURATION } from "../configuration.js"
import { createMessage, createVariant, selectBundleNested } from "@inlang/sdk2"
import { getPatternFromString, getStringFromPattern } from "../utilities/messages/query.js"

vi.mock("vscode", () => ({
	commands: {
		registerCommand: vi.fn(),
	},
	window: {
		showInputBox: vi.fn(),
		showErrorMessage: vi.fn(),
	},
}))

vi.mock("../utilities/state.js", () => ({
	state: vi.fn(),
}))

vi.mock("../utilities/messages/msg.js", () => ({
	msg: vi.fn(),
}))

vi.mock("@inlang/sdk2", () => ({
	createMessage: vi.fn(),
	createVariant: vi.fn(),
	selectBundleNested: vi.fn(),
}))

vi.mock("../configuration.js", () => ({
	CONFIGURATION: {
		EVENTS: {
			ON_DID_EDIT_MESSAGE: { fire: vi.fn() },
		},
	},
}))

describe("editMessageCommand", () => {
	let mockBundle: any = {}

	beforeEach(() => {
		mockBundle = {
			id: "testBundle",
			messages: [
				{
					id: "testMessage",
					locale: "en",
					variants: [
						{
							id: "testVariant",
							match: { locale: "en" },
							pattern: { elements: [] },
						},
					],
				},
			],
		}
	})

	it("should show a message if the bundle is not found", async () => {
		// @ts-expect-error
		vi.mocked(selectBundleNested).mockReturnValueOnce({
			where: vi.fn().mockReturnThis(),
			executeTakeFirstOrThrow: vi.fn().mockResolvedValueOnce(undefined),
		})

		await editMessageCommand.callback({ bundleId: "testMessage", locale: "en" })
		expect(msg).toHaveBeenCalledWith("Message with id testMessage not found.")
	})

	it("should create a new message if none exists for the locale", async () => {
		mockBundle = {
			id: "testBundle",
			messages: [
				{
					id: "testMessage",
					locale: "en",
					variants: [
						{
							id: "testVariant",
							match: { locale: "en" },
							pattern: { elements: [] },
						},
					],
				},
			],
		}

		// @ts-expect-error
		vi.mocked(selectBundleNested).mockReturnValueOnce({
			where: vi.fn().mockReturnThis(),
			executeTakeFirstOrThrow: vi.fn().mockResolvedValueOnce(mockBundle),
		})

		vi.mocked(createMessage).mockReturnValueOnce({
			id: "newMessage",
			bundleId: "testBundle",
			locale: "en",
			selectors: [],
			declarations: [],
			variants: [],
		})

		vi.mocked(window.showInputBox).mockResolvedValueOnce("Updated Message Content")
		vi.mocked(getStringFromPattern).mockReturnValueOnce("Updated Message Content")

		await editMessageCommand.callback({ bundleId: "newMessage", locale: "en" })

		expect(createMessage).toHaveBeenCalledWith({
			bundleId: "testBundle",
			locale: "en",
			text: "",
		})
		expect(window.showInputBox).toHaveBeenCalledWith({
			title: "Enter new value:",
			value: "Updated Message Content",
		})
		expect(state().project.db.updateTable).toHaveBeenCalled()
		expect(CONFIGURATION.EVENTS.ON_DID_EDIT_MESSAGE.fire).toHaveBeenCalled()
		expect(msg).toHaveBeenCalledWith
	})

	it("should create a new variant if none exists for the locale", async () => {
		mockBundle.messages[0].variants = []

		// @ts-expect-error
		vi.mocked(selectBundleNested).mockReturnValueOnce({
			where: vi.fn().mockReturnThis(),
			executeTakeFirstOrThrow: vi.fn().mockResolvedValueOnce(mockBundle),
		})

		vi.mocked(createVariant).mockReturnValueOnce({
			id: "newVariant",
			messageId: "testMessage",
			pattern: [
				{
					type: "text",
					value: "New Message Content",
				},
			],
			match: { locale: "en" },
		})

		vi.mocked(window.showInputBox).mockResolvedValueOnce("Updated Message Content")
		vi.mocked(getStringFromPattern).mockReturnValueOnce("Updated Message Content")

		await editMessageCommand.callback({ bundleId: "testMessage", locale: "en" })

		expect(createVariant).toHaveBeenCalledWith({ messageId: "testMessage" })
		expect(window.showInputBox).toHaveBeenCalledWith({
			title: "Enter new value:",
			value: "Updated Message Content",
		})
		expect(state().project.db.updateTable).toHaveBeenCalled()
		expect(CONFIGURATION.EVENTS.ON_DID_EDIT_MESSAGE.fire).toHaveBeenCalled()
		expect(msg).toHaveBeenCalledWith("Message updated.")
	})

	it("should update an existing message and variant", async () => {
		// @ts-expect-error
		vi.mocked(selectBundleNested).mockReturnValueOnce({
			where: vi.fn().mockReturnThis(),
			executeTakeFirstOrThrow: vi.fn().mockResolvedValueOnce(mockBundle),
		})

		vi.mocked(getStringFromPattern).mockReturnValueOnce("Current content")
		vi.mocked(getPatternFromString).mockReturnValueOnce([
			{
				type: "text",
				value: "Updated content",
			},
		])

		vi.mocked(window.showInputBox).mockResolvedValueOnce("Updated content")

		await editMessageCommand.callback({ bundleId: "testMessage", locale: "en" })

		expect(window.showInputBox).toHaveBeenCalledWith({
			title: "Enter new value:",
			value: "Current content",
		})
		expect(getPatternFromString).toHaveBeenCalledWith({ string: "Updated content" })
		expect(state().project.db.updateTable).toHaveBeenCalled()
		expect(CONFIGURATION.EVENTS.ON_DID_EDIT_MESSAGE.fire).toHaveBeenCalled()
		expect(msg).toHaveBeenCalledWith("Message updated.")
	})

	it("should cancel the operation if no new value is provided", async () => {
		vi.mocked(window.showInputBox).mockResolvedValueOnce(undefined)

		await editMessageCommand.callback({ bundleId: "testMessage", locale: "en" })

		expect(state().project.db.updateTable).not.toHaveBeenCalled()
		expect(CONFIGURATION.EVENTS.ON_DID_EDIT_MESSAGE.fire).not.toHaveBeenCalled()
	})
})
