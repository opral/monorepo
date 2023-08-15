import { describe, it, expect } from "vitest"
import { createReactiveQuery } from './createReactiveQuery.js'
import { createEffect, createRoot } from './solid.js'
import type { Message, Text } from '@inlang/plugin'

describe("get", () => {
	it.only("should react to `create`", async () => {
		createRoot(async () => {
			const query = createReactiveQuery(() => [])

			let message: Message | undefined
			createEffect(() => {
				message = query.get({ where: { id: "1" } })
				console.log(1, message)
			})
			await new Promise((resolve) => setTimeout(resolve, 100))
			expect(message).toBeUndefined()

			query.create({ data: { id: "1", selectors: [], body: {} } })
			await new Promise((resolve) => setTimeout(resolve, 100))

			expect(message).toBeDefined()

			const anotherMessage = query.get({ where: { id: "1" } })
			expect(anotherMessage).toBeDefined()
			expect(message).toStrictEqual(anotherMessage)
		})
	})

	it("should react to `update`", async () => {
		await createRoot(async () => {
			const query = createReactiveQuery(() => [])
			query.create({
				// TODO: use `createMessage` utility
				data: {
					id: "1", selectors: [], body: {
						en: [
							{
								match: {},
								pattern: [
									{
										type: "Text",
										value: "before",
									},
								],
							},
						],
					}
				}
			})

			let message: Message | undefined
			createEffect(() => {
				message = query.get({ where: { id: "1" } })
			})
			await new Promise((resolve) => setTimeout(resolve, 0))

			expect(message).toBeDefined()
			expect((message!.body.en![0]!.pattern[0]! as Text).value).toBe('before')
			query.update({
				// TODO: use `createMessage` utility
				where: { id: "1" }, data: {
					body: {
						en: [
							{
								match: {},
								pattern: [
									{
										type: "Text",
										value: "after",
									},
								],
							},
						],
					}
				}
			})
			await new Promise((resolve) => setTimeout(resolve, 0))

			expect((message!.body.en![0]!.pattern[0]! as Text).value).toBe('after')
		})
	})
})
