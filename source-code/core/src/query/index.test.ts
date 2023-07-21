import { describe, expect, it } from "vitest"
import type { Message } from "../ast/index.js"
import { query } from "./index.js"
import { createMessage } from "../test/utils.js"

describe("query.create", () => {
	it("should create a message", () => {
		const [messages] = query(mockResource).create({
			message: {
				id: "new-message-123",
				languageTag: "en",
				pattern: [],
			},
		})
		const message = query(messages!).get({ id: "new-message-123", languageTag: "en" })
		expect(message!.id).toBe("new-message-123")
	})
	it("should return an error is the message already exists", () => {
		const [, exception] = query(mockResource).create({
			message: {
				id: "first-message",
				languageTag: "en",
				pattern: [],
			},
		})
		expect(exception).toBeDefined()
	})
})

describe("query.get", () => {
	it("should return the message if the message exists", () => {
		const result = query(mockResource).get({ id: "first-message", languageTag: "en" })
		expect(result!.id).toBe("first-message")
	})
	it("should return undefined if the message does not exist", () => {
		const result = query(mockResource).get({ id: "none-existent-message", languageTag: "en" })
		expect(result).toBeUndefined()
	})
	it("should return a new message object, not a reference (for immutability)", () => {
		const result = query(mockResource).get({ id: "first-message", languageTag: "en" })
		result!.id = "changed"
		const queryAgain = query(mockResource).get({ id: "first-message", languageTag: "en" })
		expect(queryAgain!.id).toBe("first-message")
	})
})

describe("query.update", () => {
	it("should update an existing message", () => {
		const message = query(mockResource).get({ id: "first-message", languageTag: "en" })
		message!.pattern = [{ type: "Text", value: "updated" }]
		const [updatedResource] = query(mockResource).update({
			id: "first-message",
			languageTag: "en",
			with: message!,
		})
		const updatedMessage = query(updatedResource!).get({ id: "first-message", languageTag: "en" })
		expect(updatedMessage!.pattern).toStrictEqual(message!.pattern)
	})

	it("should be immutable", () => {
		const message = query(mockResource).get({ id: "first-message", languageTag: "en" })
		message!.pattern = [{ type: "Text", value: "updated" }]
		query(mockResource).update({
			id: "first-message",
			languageTag: "en",
			with: message!,
		})
		const queryMessageAgain = query(mockResource).get({ id: "first-message", languageTag: "en" })
		expect(queryMessageAgain!.pattern).not.toBe(message!.pattern)
	})

	it("should return an error if the message does not exist", () => {
		const [, exception] = query(mockResource).update({
			id: "none-existent-message",
			languageTag: "en",
			// @ts-ignore
			with: "",
		})
		expect(exception).toBeDefined()
	})
})

describe("query.upsert", () => {
	it("should upsert a message if it does not exist", () => {
		const [messages] = query(mockResource).upsert({
			message: {
				id: "new-message-1234",
				languageTag: "en",
				pattern: [],
			},
		})

		const message = query(messages!).get({ id: "new-message-1234", languageTag: "en" })
		expect(message!.id).toBe("new-message-1234")
	})

	it("should update an existing message", () => {
		const message = query(mockResource).get({ id: "first-message", languageTag: "en" })
		message!.pattern = [{ type: "Text", value: "updated" }]
		const [updatedMessages] = query(mockResource).upsert({
			message: message!,
		})
		const updatedMessage = query(updatedMessages!).get({ id: "first-message", languageTag: "en" })
		expect(updatedMessage!.pattern).toStrictEqual(message!.pattern)
	})
})

describe("query.delete", () => {
	it("should delete a message", () => {
		const [_message, exception] = query(mockResource).delete({
			id: "first-message",
			languageTag: "en",
		})
		if (exception) {
			throw exception
		}
		expect(_message).toBeDefined()
		const message = query(_message).get({ id: "first-message", languageTag: "en" })
		expect(message).toBeUndefined()
	})
	it("should be immutable", () => {
		const [, exception] = query(mockResource).delete({ id: "first-message", languageTag: "en" })
		expect(exception).toBeUndefined()
		const message = query(mockResource).get({ id: "first-message", languageTag: "en" })
		expect(message).toBeDefined()
	})
	it("should return an error if the message did not exist", () => {
		const [, exception] = query(mockResource).delete({ id: "none-existent-message", languageTag: "en" })
		expect(exception).toBeDefined()
	})
})

describe("query.ids", () => {
	it("should return all message ids in the resource", () => {
		const result = query(mockResource).includedMessageIds()
		expect(result).toEqual(["first-message", "second-message"])
	})
})

const mockResource: Message[] = [
	createMessage("first-message", "en", "Welcome to this app."),
	createMessage("second-message", "en", "You opened the app, congrats!"),
]
