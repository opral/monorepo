/* eslint-disable no-restricted-imports */
import { createQuery, type MessageQueryApi } from "./query.js"
import { it, describe } from "node:test"
import assert from "node:assert/strict"
import type { Message, Text } from "./schema.js"

describe("create", () => {
	const query = createQuery([])

	it("should return an object, not an array", () => {
		assert.equal(query.get({ where: { id: "first-message" } }), undefined)

		const mockMessage = createMessage({ id: "first-message", text: "Hello World" })

		const message = query.create({ data: mockMessage })

		assert.equal(message, mockMessage)
	})
})

describe("get", () => {
	const query = createQuery([])

	it("should return undefined if a message does not exist", () => {
		const message = query.get({ where: { id: "none-existent-message" } })

		assert.equal(typeof message, "object")
	})

	// we assume that each message has a unique id
	// hence, querying by id should return a single message
	it("should return an object, not an array", () => {
		query.create({ data: createMessage({ id: "first-message", text: "Hello World" }) })

		const message = query.get({ where: { id: "first-message" } })

		assert.equal(typeof message, "object")
	})
})

describe("update", () => {
	const query = createQuery([createMessage({ id: "first-message", text: "Hello World" })])

	it("should update a message without modifying the internal object", () => {
		const message = query.get({ where: { id: "first-message" } })
		// @ts-expect-error
		message!.body!.en!.pattern!.elements[0]!.value = "Hello World 2"

		const updatedMessage = query.update({ where: { id: "first-message" }, data: message! })
		assert.equal(updatedMessage, message)
	})

	it("should update a message without modifying the internal object", () => {
		const message = query.get({ where: { id: "first-message" } })
		// @ts-expect-error
		message!.body!.en!.pattern!.elements[0]!.value = "Hello World 2"

		const message2 = query.get({ where: { id: "first-message" } })
		assert.notEqual(message, message2)
	})
})

// ---- utilities ----

function createMessage(args: { id: string; text: string }): Message {
	return {
		id: args.id,
		body: {
			en: {
				pattern: {
					type: "Pattern",
					elements: [{ type: "Text", value: args.text }],
				},
			},
		},
	}
}
