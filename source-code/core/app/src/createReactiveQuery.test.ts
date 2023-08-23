/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { describe, it, expect } from "vitest"
import { createReactiveQuery } from "./createReactiveQuery.js"
import { createEffect, createRoot, createSignal } from "./solid.js"
import type { Message, Pattern, Text } from "@inlang/plugin"

const createChangeListener = async (cb: () => void) => createEffect(cb)

// TODO: create global util function
export const createMessage = (id: string, patterns: Record<string, Pattern | string>): Message => ({
	id,
	selectors: [],
	variants: Object.entries(patterns).map(([languageTag, patterns]) => ({
		languageTag,
		match: {},
		pattern:
			typeof patterns === "string"
				? [
						{
							type: "Text",
							value: patterns,
						},
				  ]
				: patterns,
	})),
})

describe("create", () => {
	it("should create a message", () => {
		const query = createReactiveQuery(() => [])
		expect(query.get({ where: { id: "first-message" } })).toBeUndefined()

		const mockMessage = createMessage("first-message", { en: "Hello World" })
		const created = query.create({ data: mockMessage })

		expect(query.get({ where: { id: "first-message" } })).toEqual(mockMessage)
		expect(created).toBe(true)
	})

	it("should return false if message with id already exists", () => {
		const query = createReactiveQuery(() => [createMessage("first-message", { en: "Hello World" })])
		expect(query.get({ where: { id: "first-message" } })).toBeDefined()

		const mockMessage = createMessage("first-message", { en: "Some Text" })
		query.create({ data: mockMessage })

		const created = query.create({ data: mockMessage })
		expect(created).toBe(false)
	})
})

describe("get", () => {
	it("should return undefined if a message does not exist", () => {
		const query = createReactiveQuery(() => [createMessage("first-message", { en: "Hello World" })])
		const message = query.get({ where: { id: "none-existent-message" } })
		expect(message).toBeUndefined()
	})

	it("should return an object, not an array", () => {
		const query = createReactiveQuery(() => [createMessage("first-message", { en: "Hello World" })])
		const message = query.get({ where: { id: "first-message" } })
		expect(message).toBeDefined()
		expect(Array.isArray(message)).toBe(false)
	})

	it("mutating the returned value should not affect subsequent return values", () => {
		const query = createReactiveQuery(() => [createMessage("first-message", { en: "Hello World" })])
		const message1 = query.get({ where: { id: "first-message" } })!
		;(message1.variants.find((v) => v.languageTag === "en")!.pattern![0]! as Text).value =
			"Hello World 2"
		const message2 = query.get({ where: { id: "first-message" } })!

		expect(
			(message1.variants.find((v) => v.languageTag === "en")!.pattern![0]! as Text).value,
		).toBe("Hello World 2")
		expect(
			(message2.variants.find((v) => v.languageTag === "en")!.pattern![0]! as Text).value,
		).toBe("Hello World")
	})
})

describe("getAll", () => {
	it("should return an empty array if no messages exist", () => {
		const query = createReactiveQuery(() => [])
		const messages = query.getAll()

		expect(messages).toEqual([])
	})

	it("should return all message objects", () => {
		const query = createReactiveQuery(() => [])
		const mockMessage1 = createMessage("first-message", { en: "Hello World" })
		const mockMessage2 = createMessage("second-message", { en: "Hello World 2" })
		query.create({ data: mockMessage1 })
		query.create({ data: mockMessage2 })

		const messages = query.getAll()
		expect(messages).toEqual([mockMessage1, mockMessage2])
	})

	it("mutating the returned value should not affect subsequent return values", () => {
		const query = createReactiveQuery(() => [createMessage("first-message", { en: "Hello World" })])
		const messages1 = query.getAll()
		;(messages1[0]!.variants.find((v) => v.languageTag === "en")!.pattern![0]! as Text).value =
			"Hello World 2"
		const messages2 = query.getAll()

		expect(
			(messages1[0]!.variants.find((v) => v.languageTag === "en")!.pattern![0]! as Text).value,
		).toBe("Hello World 2")
		expect(
			(messages2[0]!.variants.find((v) => v.languageTag === "en")!.pattern![0]! as Text).value,
		).toBe("Hello World")
	})
})

describe("update", () => {
	it("should update a message", () => {
		const query = createReactiveQuery(() => [createMessage("first-message", { en: "Hello World" })])
		expect(query.get({ where: { id: "first-message" } })).toBeDefined()

		const mockMessage = createMessage("first-message", { en: "Hello World 2" })
		const updated = query.update({ where: { id: "first-message" }, data: mockMessage })

		expect(query.get({ where: { id: "first-message" } })).toEqual(mockMessage)
		expect(updated).toBe(true)
	})

	it("should return false if message with id does not exist exists", () => {
		const query = createReactiveQuery(() => [])
		expect(query.get({ where: { id: "first-message" } })).toBeUndefined()

		const mockMessage = createMessage("first-message", { en: "Hello World" })
		const updated = query.update({ where: { id: "first-message" }, data: mockMessage })
		expect(updated).toBe(false)
	})
})

describe("upsert", () => {
	it("should create a message if not present yet", () => {
		const query = createReactiveQuery(() => [])
		expect(query.get({ where: { id: "first-message" } })).toBeUndefined()

		const mockMessage = createMessage("first-message", { en: "Hello World" })
		const upserted = query.upsert({ where: { id: "first-message" }, data: mockMessage })

		expect(query.get({ where: { id: "first-message" } })).toEqual(mockMessage)
		expect(upserted).toBe(true)
	})

	it("should update message if id already exists", () => {
		const query = createReactiveQuery(() => [createMessage("first-message", { en: "Hello World" })])
		expect(query.get({ where: { id: "first-message" } })).toBeDefined()

		const mockMessage = createMessage("first-message", { en: "Hello World 2" })
		const upserted = query.upsert({ where: { id: "first-message" }, data: mockMessage })

		expect(query.get({ where: { id: "first-message" } })).toEqual(mockMessage)
		expect(upserted).toBe(true)
	})
})

describe("delete", () => {
	it("should delete a message", () => {
		const query = createReactiveQuery(() => [createMessage("first-message", { en: "Hello World" })])
		expect(query.get({ where: { id: "first-message" } })).toBeDefined()

		const deleted = query.delete({ where: { id: "first-message" } })

		expect(query.get({ where: { id: "first-message" } })).toBeUndefined()
		expect(deleted).toBe(true)
	})

	it("should return false if message with id does not exist", () => {
		const query = createReactiveQuery(() => [])
		expect(query.get({ where: { id: "first-message" } })).toBeUndefined()

		const deleted = query.delete({ where: { id: "first-message" } })
		expect(deleted).toBe(false)
	})
})

describe("reactivity", () => {
	describe("get", () => {
		it("should react to `create`", async () => {
			await createRoot(async () => {
				const query = createReactiveQuery(() => [])

				// eslint-disable-next-line unicorn/no-null
				let message: Message | undefined | null = null
				await createChangeListener(() => (message = query.get({ where: { id: "1" } })))
				expect(message).toBeUndefined()

				query.create({ data: createMessage("1", { en: "before" }) })
				expect(message).toBeDefined()

				const anotherMessage = query.get({ where: { id: "1" } })
				expect(anotherMessage).toBeDefined()
				expect(message).toStrictEqual(anotherMessage)
			})
		})

		it("should react to `update`", async () => {
			await createRoot(async () => {
				const query = createReactiveQuery(() => [createMessage("1", { en: "before" })])

				let message: Message | undefined
				await createChangeListener(() => (message = query.get({ where: { id: "1" } })))
				expect(message).toBeDefined()
				expect(
					(message?.variants.find((variant) => variant.languageTag === "en")?.pattern[0] as Text)
						.value,
				).toBe("before")

				query.update({ where: { id: "1" }, data: createMessage("1", { en: "after" }) })
				expect(
					(message?.variants.find((variant) => variant.languageTag === "en")?.pattern[0] as Text)
						.value,
				).toBe("after")
			})
		})

		it("should react to `upsert`", async () => {
			await createRoot(async () => {
				const query = createReactiveQuery(() => [])

				let message: Message | undefined
				await createChangeListener(() => (message = query.get({ where: { id: "1" } })))
				expect(message).toBeUndefined()

				query.upsert({ where: { id: "1" }, data: createMessage("1", { en: "before" }) })
				expect(message).toBeDefined()
				expect(
					(message?.variants.find((variant) => variant.languageTag === "en")?.pattern[0] as Text)
						.value,
				).toBe("before")

				query.upsert({ where: { id: "1" }, data: createMessage("1", { en: "after" }) })
				expect(
					(message?.variants.find((variant) => variant.languageTag === "en")?.pattern[0] as Text)
						.value,
				).toBe("after")
			})
		})

		it("should react to `delete`", async () => {
			await createRoot(async () => {
				const query = createReactiveQuery(() => [createMessage("1", { en: "" })])

				let message: Message | undefined
				await createChangeListener(() => (message = query.get({ where: { id: "1" } })))
				expect(message).toBeDefined()

				query.delete({ where: { id: "1" } })
				expect(message).toBeUndefined()
			})
		})

		it("should react to changes to the input `messages`", async () => {
			const [messages, setMessages] = createSignal<Message[]>([])
			const query = createReactiveQuery(messages)

			// eslint-disable-next-line unicorn/no-null
			let message: Message | undefined | null = null
			await createChangeListener(() => (message = query.get({ where: { id: "1" } })))
			expect(message).toBeUndefined()

			query.create({ data: createMessage("1", { en: "before" }) })
			expect(message).toBeDefined()
			expect(
				(message!.variants.find((variant) => variant.languageTag === "en")?.pattern[0] as Text)
					.value,
			).toBe("before")

			setMessages([createMessage("1", { en: "after" })])
			expect(message).toBeDefined()
			expect(
				(message!.variants.find((variant) => variant.languageTag === "en")?.pattern[0] as Text)
					.value,
			).toBe("after")
		})
	})

	describe("getAll", () => {
		it("should react to `create`", async () => {
			await createRoot(async () => {
				const query = createReactiveQuery(() => [])

				let messages: Message[] | undefined = undefined
				await createChangeListener(() => (messages = query.getAll()))
				expect(messages).toHaveLength(0)

				query.create({ data: createMessage("1", { en: "before" }) })
				expect(messages).toHaveLength(1)

				query.create({ data: createMessage("2", { en: "before" }) })
				expect(messages).toHaveLength(2)

				query.create({ data: createMessage("3", { en: "before" }) })
				expect(messages).toHaveLength(3)
			})
		})

		it("should react to `update`", async () => {
			await createRoot(async () => {
				const query = createReactiveQuery(() => [createMessage("1", { en: "before" })])

				let messages: Message[] | undefined = undefined
				await createChangeListener(() => (messages = query.getAll()))
				expect(messages).toHaveLength(1)
				expect(
					(
						messages![0]!.variants.find((variant) => variant.languageTag === "en")!
							.pattern[0]! as Text
					).value,
				).toBe("before")

				query.update({ where: { id: "1" }, data: createMessage("1", { en: "after" }) })
				expect(messages).toHaveLength(1)
				expect(
					(
						messages![0]!.variants.find((variant) => variant.languageTag === "en")!
							.pattern[0]! as Text
					).value,
				).toBe("after")
			})
		})

		it("should react to `upsert`", async () => {
			await createRoot(async () => {
				const query = createReactiveQuery(() => [])

				let messages: Message[] | undefined
				await createChangeListener(() => (messages = query.getAll()))
				expect(messages).toHaveLength(0)

				query.upsert({ where: { id: "1" }, data: createMessage("1", { en: "before" }) })
				expect(messages).toHaveLength(1)
				expect(
					(
						messages![0]!.variants.find((variant) => variant.languageTag === "en")!
							.pattern[0]! as Text
					).value,
				).toBe("before")

				query.upsert({ where: { id: "1" }, data: createMessage("1", { en: "after" }) })
				expect(
					(
						messages![0]!.variants.find((variant) => variant.languageTag === "en")!
							.pattern[0]! as Text
					).value,
				).toBe("after")
			})
		})

		it("should react to `delete`", async () => {
			await createRoot(async () => {
				const query = createReactiveQuery(() => [
					createMessage("1", { en: "" }),
					createMessage("2", { en: "" }),
					createMessage("3", { en: "" }),
				])

				let messages: Message[] | undefined
				await createChangeListener(() => (messages = query.getAll()))
				expect(messages).toHaveLength(3)

				query.delete({ where: { id: "1" } })
				expect(messages).toHaveLength(2)

				// deleting the same id again should not have an effect
				query.delete({ where: { id: "1" } })
				expect(messages).toHaveLength(2)

				query.delete({ where: { id: "2" } })
				expect(messages).toHaveLength(1)

				query.delete({ where: { id: "3" } })
				expect(messages).toHaveLength(0)
			})
		})

		it("should react to changes to the input `messages`", async () => {
			const [inputMessages, setMessages] = createSignal<Message[]>([
				createMessage("1", { en: "before" }),
			])
			const query = createReactiveQuery(inputMessages)

			let messages: Message[] | undefined
			await createChangeListener(() => (messages = query.getAll()))
			expect(messages).toHaveLength(1)

			query.create({ data: createMessage("2", { en: "" }) })
			expect(messages).toHaveLength(2)
			expect(
				(
					messages![0]!.variants.find((variant) => variant.languageTag === "en")!
						.pattern[0]! as Text
				).value,
			).toBe("before")

			setMessages([createMessage("1", { en: "after" })])
			expect(messages).toHaveLength(1)
			expect(
				(
					messages![0]!.variants.find((variant) => variant.languageTag === "en")!
						.pattern[0]! as Text
				).value,
			).toBe("after")
		})
	})
})

it("instances should not share state", async () => {
	await createRoot(async () => {
		const query1 = createReactiveQuery(() => [createMessage("1", { en: "before" })])
		const query2 = createReactiveQuery(() => [])

		// eslint-disable-next-line unicorn/no-null
		let message1: Message | undefined | null = null
		await createChangeListener(() => (message1 = query1.get({ where: { id: "1" } })))
		// eslint-disable-next-line unicorn/no-null
		let message2: Message | undefined | null = null
		await createChangeListener(() => (message2 = query2.get({ where: { id: "1" } })))

		expect(message1).toBeDefined()
		expect(message2).toBeUndefined()

		query2.create({ data: createMessage("1", { en: "before" }) })
		expect(message2).toBeDefined()

		query1.update({ where: { id: "1" }, data: createMessage("1", { en: "after" }) })
		expect(
			(message1!.variants.find((variant) => variant.languageTag === "en")!.pattern[0]! as Text)
				.value,
		).toBe("after")
		expect(
			(message2!.variants.find((variant) => variant.languageTag === "en")!.pattern[0]! as Text)
				.value,
		).toBe("before")

		query1.delete({ where: { id: "1" } })
		expect(message1).toBeUndefined()
		expect(message2).toBeDefined()
	})
})
