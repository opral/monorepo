/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { describe, it, expect } from "vitest"
import { createReactiveQuery } from './createReactiveQuery.js'
import { createEffect, createRoot, createSignal } from './solid.js'
import type { Message, Pattern, Text } from '@inlang/plugin'
// TODO: find a better approach to share tests between packages
import { queryBaseTests } from '../../../../node_modules/@inlang/messages/dist/query.test-util.js'

const createChangeListener = async (cb: () => void) => createEffect(cb)

// TODO: create global util function
export const createMessage = (id: string, patterns: Record<string, Pattern | string>): Message => ({
	id,
	selectors: [],
	body: Object.fromEntries(
		Object.entries(patterns).map(([languageTag, patterns]) => [
			languageTag,
			[
				{
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
				},
			],
		]),
	),
})

await queryBaseTests({
	createQueryFn: (messages) => createReactiveQuery(() => messages),
})

describe("reactivity", () => {
	describe("get", () => {
		it("should react to `create`", async () => {
			await createRoot(async () => {
				const query = createReactiveQuery(() => [])

				// eslint-disable-next-line unicorn/no-null
				let message: Message | undefined | null = null
				await createChangeListener(() =>
					message = query.get({ where: { id: "1" } })
				)
				expect(message).toBeUndefined()

				query.create({ data: createMessage('1', { 'en': 'before' }) })
				expect(message).toBeDefined()

				const anotherMessage = query.get({ where: { id: "1" } })
				expect(anotherMessage).toBeDefined()
				expect(message).toStrictEqual(anotherMessage)
			})
		})

		it("should react to `update`", async () => {
			await createRoot(async () => {
				const query = createReactiveQuery(() => [createMessage('1', { 'en': 'before' })])

				let message: Message | undefined
				await createChangeListener(() =>
					message = query.get({ where: { id: "1" } })
				)
				expect(message).toBeDefined()
				expect((message!.body.en![0]!.pattern[0]! as Text).value).toBe('before')

				query.update({ where: { id: "1" }, data: createMessage('1', { 'en': 'after' }) })
				expect((message!.body.en![0]!.pattern[0]! as Text).value).toBe('after')
			})
		})

		it("should react to `upsert`", async () => {
			await createRoot(async () => {
				const query = createReactiveQuery(() => [])

				let message: Message | undefined
				await createChangeListener(() =>
					message = query.get({ where: { id: "1" } })
				)
				expect(message).toBeUndefined()

				query.upsert({ where: { id: '1' }, data: createMessage('1', { 'en': 'before' }) })
				expect(message).toBeDefined()
				expect((message!.body.en![0]!.pattern[0]! as Text).value).toBe('before')

				query.upsert({ where: { id: "1" }, data: createMessage('1', { 'en': 'after' }) })
				expect((message!.body.en![0]!.pattern[0]! as Text).value).toBe('after')
			})
		})

		it("should react to `delete`", async () => {
			await createRoot(async () => {
				const query = createReactiveQuery(() => [createMessage('1', { 'en': '' })])

				let message: Message | undefined
				await createChangeListener(() =>
					message = query.get({ where: { id: "1" } })
				)
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
			await createChangeListener(() =>
				message = query.get({ where: { id: "1" } })
			)
			expect(message).toBeUndefined()

			query.create({ data: createMessage('1', { 'en': 'before' }) })
			expect(message).toBeDefined()
			expect((message!.body.en![0]!.pattern[0]! as Text).value).toBe('before')

			setMessages([createMessage('1', { 'en': 'after' })])
			expect(message).toBeDefined()
			expect((message!.body.en![0]!.pattern[0]! as Text).value).toBe('after')
		})
	})

	describe("getAll", () => {
		it("should react to `create`", async () => {
			await createRoot(async () => {
				const query = createReactiveQuery(() => [])

				let messages: Message[] | undefined = undefined
				await createChangeListener(() =>
					messages = query.getAll()
				)
				expect(messages).toHaveLength(0)

				query.create({ data: createMessage('1', { 'en': 'before' }) })
				expect(messages).toHaveLength(1)

				query.create({ data: createMessage('2', { 'en': 'before' }) })
				expect(messages).toHaveLength(2)

				query.create({ data: createMessage('3', { 'en': 'before' }) })
				expect(messages).toHaveLength(3)
			})
		})

		it("should react to `update`", async () => {
			await createRoot(async () => {
				const query = createReactiveQuery(() => [createMessage('1', { 'en': 'before' })])

				let messages: Message[] | undefined = undefined
				await createChangeListener(() =>
					messages = query.getAll()
				)
				expect(messages).toHaveLength(1)
				expect((messages![0]!.body.en![0]!.pattern[0]! as Text).value).toBe('before')

				query.update({ where: { id: "1" }, data: createMessage('1', { 'en': 'after' }) })
				expect(messages).toHaveLength(1)
				expect((messages![0]!.body.en![0]!.pattern[0]! as Text).value).toBe('after')
			})
		})

		it("should react to `upsert`", async () => {
			await createRoot(async () => {
				const query = createReactiveQuery(() => [])

				let messages: Message[] | undefined
				await createChangeListener(() =>
					messages = query.getAll()
				)
				expect(messages).toHaveLength(0)

				query.upsert({ where: { id: '1' }, data: createMessage('1', { 'en': 'before' }) })
				expect(messages).toHaveLength(1)
				expect((messages![0]!.body.en![0]!.pattern[0]! as Text).value).toBe('before')

				query.upsert({ where: { id: "1" }, data: createMessage('1', { 'en': 'after' }) })
				expect((messages![0]!.body.en![0]!.pattern[0]! as Text).value).toBe('after')
			})
		})

		it("should react to `delete`", async () => {
			await createRoot(async () => {
				const query = createReactiveQuery(() => [
					createMessage('1', { 'en': '' }),
					createMessage('2', { 'en': '' }),
					createMessage('3', { 'en': '' })
				])

				let messages: Message[] | undefined
				await createChangeListener(() =>
					messages = query.getAll()
				)
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
			const [inputMessages, setMessages] = createSignal<Message[]>([createMessage('1', { 'en': 'before' })])
			const query = createReactiveQuery(inputMessages)

			let messages: Message[] | undefined
			await createChangeListener(() =>
				messages = query.getAll()
			)
			expect(messages).toHaveLength(1)

			query.create({ data: createMessage('2', { 'en': '' }) })
			expect(messages).toHaveLength(2)
			expect((messages![0]!.body.en![0]!.pattern[0]! as Text).value).toBe('before')

			setMessages([createMessage('1', { 'en': 'after' })])
			expect(messages).toHaveLength(1)
			expect((messages![0]!.body.en![0]!.pattern[0]! as Text).value).toBe('after')
		})
	})
})

it("instances should not share state", async () => {
	await createRoot(async () => {
		const query1 = createReactiveQuery(() => [createMessage('1', { 'en': 'before' })])
		const query2 = createReactiveQuery(() => [])

		// eslint-disable-next-line unicorn/no-null
		let message1: Message | undefined | null = null
		await createChangeListener(() =>
			message1 = query1.get({ where: { id: "1" } })
		)
		// eslint-disable-next-line unicorn/no-null
		let message2: Message | undefined | null = null
		await createChangeListener(() =>
			message2 = query2.get({ where: { id: "1" } })
		)

		expect(message1).toBeDefined()
		expect(message2).toBeUndefined()

		query2.create({ data: createMessage('1', { 'en': 'before' }) })
		expect(message2).toBeDefined()

		query1.update({ where: { id: '1' }, data: createMessage('1', { 'en': 'after' }) })
		expect((message1!.body.en![0]!.pattern[0]! as Text).value).toBe('after')
		expect((message2!.body.en![0]!.pattern[0]! as Text).value).toBe('before')

		query1.delete({ where: { id: "1" } })
		expect(message1).toBeUndefined()
		expect(message2).toBeDefined()
	})
})
