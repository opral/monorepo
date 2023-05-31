import { describe, expect, it } from "vitest"
import type { Resource } from "../ast/index.js"
import { query } from "./index.js"
import { createMessage, createResource } from '../test/utils.js'

describe("query.create", () => {
	it("should create a message", () => {
		const [resource] = query(mockResource).create({
			message: {
				type: "Message",
				id: { type: "Identifier", name: "new-message-123" },
				pattern: { type: "Pattern", elements: [] },
			},
		})
		const message = query(resource!).get({ id: "new-message-123" })
		expect(message!.id.name).toBe("new-message-123")
	})
	it("should return an error is the message already exists", () => {
		const [, exception] = query(mockResource).create({
			message: {
				type: "Message",
				id: { type: "Identifier", name: "first-message" },
				pattern: { type: "Pattern", elements: [] },
			},
		})
		expect(exception).toBeDefined()
	})
})

describe("query.get", () => {
	it("should return the message if the message exists", () => {
		const result = query(mockResource).get({ id: "first-message" })
		expect(result!.id.name).toBe("first-message")
	})
	it("should return undefined if the message does not exist", () => {
		const result = query(mockResource).get({ id: "none-existent-message" })
		expect(result).toBeUndefined()
	})
	it("should return a new message object, not a reference (for immutability)", () => {
		const result = query(mockResource).get({ id: "first-message" })
		result!.id.name = "changed"
		const queryAgain = query(mockResource).get({ id: "first-message" })
		expect(queryAgain!.id.name).toBe("first-message")
	})
})

describe("query.update", () => {
	it("should update an existing message", () => {
		const message = query(mockResource).get({ id: "first-message" })
		message!.pattern.elements = [{ type: "Text", value: "updated" }]
		const [updatedResource] = query(mockResource).update({
			id: "first-message",
			with: message!,
		})
		const updatedMessage = query(updatedResource!).get({ id: "first-message" })
		expect(updatedMessage!.pattern.elements).toStrictEqual(message!.pattern.elements)
	})

	it("should be immutable", () => {
		const message = query(mockResource).get({ id: "first-message" })
		message!.pattern.elements = [{ type: "Text", value: "updated" }]
		query(mockResource).update({
			id: "first-message",
			with: message!,
		})
		const queryMessageAgain = query(mockResource).get({ id: "first-message" })
		expect(queryMessageAgain!.pattern.elements).not.toBe(message!.pattern.elements)
	})

	it("should return an error if the message does not exist", () => {
		const [, exception] = query(mockResource).update({
			id: "none-existent-message",
			// @ts-ignore
			with: "",
		})
		expect(exception).toBeDefined()
	})
})

describe("query.upsert", () => {
	it("should upsert a message if it does not exist", () => {
		const [resource] = query(mockResource).upsert({
			message: {
				type: "Message",
				id: { type: "Identifier", name: "new-message-1234" },
				pattern: { type: "Pattern", elements: [] },
			},
		})

		const message = query(resource!).get({ id: "new-message-1234" })
		expect(message!.id.name).toBe("new-message-1234")
	})

	it("should update an existing message", () => {
		const message = query(mockResource).get({ id: "first-message" })
		message!.pattern.elements = [{ type: "Text", value: "updated" }]
		const [updatedResource] = query(mockResource).upsert({
			message: message!,
		})
		const updatedMessage = query(updatedResource!).get({ id: "first-message" })
		expect(updatedMessage!.pattern.elements).toStrictEqual(message!.pattern.elements)
	})
})

describe("query.delete", () => {
	it("should delete a message", () => {
		const [value, exception] = query(mockResource).delete({ id: "first-message" })
		if (exception) {
			throw exception
		}
		expect(value.type).toBe("Resource")
		const message = query(value).get({ id: "first-message" })
		expect(message).toBeUndefined()
	})
	it("should be immutable", () => {
		const [, exception] = query(mockResource).delete({ id: "first-message" })
		expect(exception).toBeUndefined()
		const message = query(mockResource).get({ id: "first-message" })
		expect(message).toBeDefined()
	})
	it("should return an error if the message did not exist", () => {
		const [, exception] = query(mockResource).delete({ id: "none-existent-message" })
		expect(exception).toBeDefined()
	})
})

describe("query.ids", () => {
	it("should return all message ids in the resource", () => {
		const result = query(mockResource).includedMessageIds()
		expect(result).toEqual(["first-message", "second-message"])
	})
})

const mockResource: Resource = createResource('en',
	createMessage('first-message', "Welcome to this app."),
	createMessage('second-message', "You opened the app, congrats!"),
)
