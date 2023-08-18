/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { createQuery } from "./query.js"
import { it, describe, expect } from "vitest"
import type { Message, Text } from "./schema.js"

describe("create", () => {
	it("should create a message", () => {
		const query = createQuery([])
		expect(query.get({ where: { id: "first-message" } })).toBeUndefined()

		const mockMessage = createMessage({ id: "first-message", text: "Hello World" })
		const created = query.create({ data: mockMessage })

		expect(query.get({ where: { id: "first-message" } })).toEqual(mockMessage)
		expect(created).toBe(true)
	})

	it("should return false if message with id already exists", () => {
		const query = createQuery([createMessage({ id: "first-message", text: "Hello World" })])
		expect(query.get({ where: { id: "first-message" } })).toBeDefined()

		const mockMessage = createMessage({ id: "first-message", text: "Some Text" })
		query.create({ data: mockMessage })

		const created = query.create({ data: mockMessage })
		expect(created).toBe(false)
	})
})

describe("get", () => {
	it("should return undefined if a message does not exist", () => {
		const query = createQuery([createMessage({ id: "first-message", text: "Hello World" })])
		const message = query.get({ where: { id: "none-existent-message" } })
		expect(message).toBeUndefined()
	})

	it("should return an object, not an array", () => {
		const query = createQuery([createMessage({ id: "first-message", text: "Hello World" })])
		const message = query.get({ where: { id: "first-message" } })
		expect(message).toBeDefined()
		expect(Array.isArray(message)).toBe(false)
	})

	it("mutating the returned value should not affect subsequent return values", () => {
		const query = createQuery([createMessage({ id: "first-message", text: "Hello World" })])
		const message1 = query.get({ where: { id: "first-message" } })!;
		(message1.body.en![0]!.pattern![0]! as Text).value = "Hello World 2"
		const message2 = query.get({ where: { id: "first-message" } })!

		expect((message1.body.en![0]!.pattern![0]! as Text).value).toBe("Hello World 2")
		expect((message2.body.en![0]!.pattern![0]! as Text).value).toBe("Hello World")
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

	it("mutating the returned value should not affect subsequent return values", () => {
		const query = createQuery([createMessage({ id: "first-message", text: "Hello World" })])
		const messages1 = query.getAll();
		(messages1[0]!.body.en![0]!.pattern![0]! as Text).value = "Hello World 2"
		const messages2 = query.getAll()

		expect((messages1[0]!.body.en![0]!.pattern![0]! as Text).value).toBe("Hello World 2")
		expect((messages2[0]!.body.en![0]!.pattern![0]! as Text).value).toBe("Hello World")
	})
})

describe("update", () => {
	it("should update a message", () => {
		const query = createQuery([createMessage({ id: "first-message", text: "Hello World" })])
		expect(query.get({ where: { id: "first-message" } })).toBeDefined()

		const mockMessage = createMessage({ id: "first-message", text: "Hello World 2" })
		const updated = query.update({ where: { id: "first-message" }, data: mockMessage })

		expect(query.get({ where: { id: "first-message" } })).toEqual(mockMessage)
		expect(updated).toBe(true)
	})

	it("should return false if message with id does not exist exists", () => {
		const query = createQuery([])
		expect(query.get({ where: { id: "first-message" } })).toBeUndefined()

		const mockMessage = createMessage({ id: "first-message", text: "Hello World" })
		const updated = query.update({ where: { id: 'first-message' }, data: mockMessage })
		expect(updated).toBe(false)
	})
})

describe("upsert", () => {
	it("should create a message if not present yet", () => {
		const query = createQuery([])
		expect(query.get({ where: { id: "first-message" } })).toBeUndefined()

		const mockMessage = createMessage({ id: "first-message", text: "Hello World" })
		const upserted = query.upsert({ where: { id: 'first-message' }, data: mockMessage })

		expect(query.get({ where: { id: "first-message" } })).toEqual(mockMessage)
		expect(upserted).toBe(true)
	})

	it("should update message if id already exists", () => {
		const query = createQuery([createMessage({ id: "first-message", text: "Hello World" })])
		expect(query.get({ where: { id: "first-message" } })).toBeDefined()

		const mockMessage = createMessage({ id: "first-message", text: "Hello World 2" })
		const upserted = query.upsert({ where: { id: 'first-message' }, data: mockMessage })

		expect(query.get({ where: { id: "first-message" } })).toEqual(mockMessage)
		expect(upserted).toBe(true)
	})
})

describe("delete", () => {
	it("should delete a message", () => {
		const query = createQuery([createMessage({ id: "first-message", text: "Hello World" })])
		expect(query.get({ where: { id: "first-message" } })).toBeDefined()

		const deleted = query.delete({ where: { id: 'first-message' } })

		expect(query.get({ where: { id: "first-message" } })).toBeUndefined()
		expect(deleted).toBe(true)
	})

	it("should return false if message with id does not exist", () => {
		const query = createQuery([])
		expect(query.get({ where: { id: "first-message" } })).toBeUndefined()

		const deleted = query.delete({ where: { id: 'first-message' } })
		expect(deleted).toBe(false)
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
