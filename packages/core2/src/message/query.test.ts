import { createQuery } from "./query.js"
import { it, describe, expect } from "vitest"
import type { Message } from "./schema.js"

describe("create", () => {
	const query = createQuery([])

	it("should return an object, not an array", () => {
		expect(query.get({ where: { id: "first-message" } })).toBeUndefined()

		const mockMessage = createMessage({ id: "first-message", text: "Hello World" })

		const message = query.create({ data: mockMessage })

		expect(message).toEqual(mockMessage)
	})
})

describe("get", () => {
	const query = createQuery([])

	it("should return undefined if a message does not exist", () => {
		const message = query.get({ where: { id: "none-existent-message" } })

		expect(typeof message).toBe("object")
	})

	// we assume that each message has a unique id
	// hence, querying by id should return a single message
	it("should return an object, not an array", () => {
		query.create({ data: createMessage({ id: "first-message", text: "Hello World" }) })

		const message = query.get({ where: { id: "first-message" } })

		expect(typeof message).toBe("object")
	})
})

describe("update", () => {
	const query = createQuery([createMessage({ id: "first-message", text: "Hello World" })])

	it("should update a message without modifying the internal object", () => {
		const message = query.get({ where: { id: "first-message" } })
		// @ts-expect-error
		message!.body!.en!.pattern!.elements[0]!.value = "Hello World 2"

		const updatedMessage = query.update({ where: { id: "first-message" }, data: message! })
		expect(updatedMessage).toEqual(message)
	})

	it("should update a message without modifying the internal object", () => {
		const message = query.get({ where: { id: "first-message" } })
		// @ts-expect-error
		message!.body!.en!.pattern!.elements[0]!.value = "Hello World 2"

		const message2 = query.get({ where: { id: "first-message" } })
		expect(message).not.toEqual(message2)
	})
})

// ---- utilities ----

function createMessage(args: { id: string; text: string }): Message {
	return {
		id: args.id,
		expressions: [],
		selectors: [],
		body: {
			en: [
				{
					match: {},
					pattern: [{ type: "Text", value: args.text }],
				},
			],
		},
	}
}
