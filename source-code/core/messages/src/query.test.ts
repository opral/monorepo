import { createQuery } from "./query.js"
import { it, describe, expect } from "vitest"
import type { Message } from "./schema.js"

// TODO: test return value of mutation functions

describe("create", () => {
	const query = createQuery([])

	it("should create a message", () => {
		expect(query.get({ where: { id: "first-message" } })).toBeUndefined()

		const mockMessage = createMessage({ id: "first-message", text: "Hello World" })

		query.create({ data: mockMessage })

		expect(query.get({ where: { id: "first-message" } })).toEqual(mockMessage)
	})
})

describe("get", () => {
	const query = createQuery([])

	it("should return undefined if a message does not exist", () => {
		const message = query.get({ where: { id: "none-existent-message" } })

		expect(typeof message).toBe("undefined")
	})

	// we assume that each message has a unique id
	// hence, querying by id should return a single message
	it("should return an object, not an array", () => {
		query.create({ data: createMessage({ id: "first-message", text: "Hello World" }) })

		const message = query.get({ where: { id: "first-message" } })

		expect(typeof message).toBe("object")
	})
})

describe("getAll", () => {
	it("should return an empty array if no messages exist", () => {
		const query = createQuery([])
		const messages = query.getAll()

		expect(messages).toEqual([])
	})
	it("should return all message objects", () => {
		const query = createQuery([])
		const mockMessage1 = createMessage({ id: "first-message", text: "Hello World" })
		const mockMessage2 = createMessage({ id: "second-message", text: "Hello World 2" })

		query.create({ data: mockMessage1 })
		query.create({ data: mockMessage2 })

		const messages = query.getAll()

		expect(messages).toEqual([mockMessage1, mockMessage2])
	})
})

describe("update", () => {
	it("should update a message without modifying the internal object", () => {
		const query = createQuery([createMessage({ id: "first-message", text: "Hello World" })])
		const message = query.get({ where: { id: "first-message" } })
		// @ts-expect-error
		message!.body!.en![0].pattern![0].value = "Hello World 2"

		query.update({ where: { id: "first-message" }, data: message! })
		const updatedMessage = query.get({ where: { id: "first-message" } })
		expect(updatedMessage).toEqual(message)
	})

	it("should update a message without modifying the internal object for get", () => {
		const query = createQuery([createMessage({ id: "first-message", text: "Hello World" })])
		const message = query.get({ where: { id: "first-message" } })
		// @ts-expect-error
		message!.body!.en![0].pattern![0].value = "Hello World 2"

		const message2 = query.get({ where: { id: "first-message" } })
		expect(message).not.toEqual(message2)
	})

	it("should update a message without modifying the internal object for getAll", () => {
		const query = createQuery([createMessage({ id: "first-message", text: "Hello World" })])
		const messages = query.getAll()
		// @ts-expect-error
		messages[0]!.body!.en![0].pattern![0].value = "Hello World 2"

		const messages2 = query.getAll()
		expect(messages).not.toEqual(messages2)
	})
})

// ---- utilities ----

function createMessage(args: { id: string; text: string }): Message {
	return {
		id: args.id,
		selectors: [],
		body: {
			en: [
				{
					match: {},
					pattern: [
						{
							type: "Text",
							value: args.text,
						},
					],
				},
			],
		},
	}
}
