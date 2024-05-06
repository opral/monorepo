/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { describe, it, expect } from "vitest"
import { createMessagesQuery } from "./createMessagesQuery.js"
import { createEffect, createRoot, createSignal } from "./reactivity/solid.js"
import { Message, type Text } from "@inlang/message"
import { createMessage } from "./test-utilities/createMessage.js"
import { createNodeishMemoryFs } from "@lix-js/fs"
import type { resolveModules } from "./resolve-modules/resolveModules.js"
import type { ProjectSettings } from "./versionedInterfaces.js"
import type { InlangProject } from "./api.js"

const createChangeListener = async (cb: () => void) => createEffect(cb)
const nextTick = () => new Promise((resolve) => setTimeout(resolve, 0))

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const awaitableCreateMessageQuery = async (_messages: () => Message[]) => {
	const fs = createNodeishMemoryFs()
	const settings: ProjectSettings = {
		sourceLanguageTag: "en",
		languageTags: ["en"],
		modules: ["plugin.js", "lintRule.js"],
		messageLintRuleLevels: {
			"messageLintRule.project.missingTranslation": "error",
		},
		"plugin.project.i18next": {
			pathPattern: "./examples/example01/{languageTag}.json",
			variableReferencePattern: ["{", "}"],
		},
	}

	let messages: any = _messages()

	const resolvedModules: Awaited<ReturnType<typeof resolveModules>> = {
		meta: [],
		plugins: [],
		messageLintRules: [],
		resolvedPluginApi: {
			loadMessages: (() => {
				return messages
			}) as any,
			saveMessages: ((newMessages: any) => {
				messages = newMessages
			}) as any,
			customApi: {},
		},
		errors: [],
	}

	return new Promise<InlangProject["query"]["messages"]>((res, rej) => {
		const query = createMessagesQuery({
			projectPath: "",
			nodeishFs: fs,
			settings: () => settings,
			resolvedModules: () => resolvedModules,
			onInitialMessageLoadResult: (error) => {
				if (error) {
					rej(error)
				} else {
					res(query)
				}
			},
			onLoadMessageResult: () => {},
			onSaveMessageResult: () => {},
		})
	})
}

describe("create", async () => {
	it("should create a message", async () => {
		const query = await awaitableCreateMessageQuery(() => [])
		expect(query.get({ where: { id: "first-message" } })).toBeUndefined()

		const mockMessage = createMessage("first-message", { en: "Hello World" })
		const created = query.create({ data: mockMessage })

		expect(query.get({ where: { id: "first-message" } })).toEqual(mockMessage)
		expect(created).toBe(true)
	})

	it("query.getByDefaultAlias should return a message with a default alias", async () => {
		const query = await awaitableCreateMessageQuery(() => [])
		expect(query.get({ where: { id: "first-message" } })).toBeUndefined()

		const mockMessage = createMessage("first-message", { en: "Hello World" })
		mockMessage.alias = { default: "first-message-alias" }
		const created = query.create({ data: mockMessage })

		expect(query.get({ where: { id: "first-message" } })).toEqual(mockMessage)
		expect(query.getByDefaultAlias("first-message-alias")).toEqual(mockMessage)
		expect(created).toBe(true)
	})

	it("should return false if message with id already exists", async () => {
		const query = await awaitableCreateMessageQuery(() => [
			createMessage("first-message", { en: "Hello World" }),
		])
		expect(query.get({ where: { id: "first-message" } })).toBeDefined()

		const mockMessage = createMessage("first-message", { en: "Some Text" })
		query.create({ data: mockMessage })

		const created = query.create({ data: mockMessage })
		expect(created).toBe(false)
	})
})

describe("get", async () => {
	it("should return undefined if a message does not exist", async () => {
		const query = await awaitableCreateMessageQuery(() => [
			createMessage("first-message", { en: "Hello World" }),
		])

		const message = query.get({ where: { id: "none-existent-message" } })
		expect(message).toBeUndefined()
	})

	it("should return an object, not an array", async () => {
		const query = await awaitableCreateMessageQuery(() => [
			createMessage("first-message", { en: "Hello World" }),
		])
		expect(query.get({ where: { id: "first-message" } })).toBeDefined()

		const mockMessageInit = createMessage("first-message", { en: "Hello World" })
		query.create({ data: mockMessageInit })

		const message = query.get({ where: { id: "first-message" } })
		expect(message).toBeDefined()
		expect(Array.isArray(message)).toBe(false)
	})

	// todo: improve the readonly type
	it.skip("mutating the returned value should not affect subsequent return values", async () => {
		const query = await awaitableCreateMessageQuery(() => [
			createMessage("first-message", { en: "Hello World" }),
		])
		const message1 = query.get({ where: { id: "first-message" } })!
		;(message1.variants.find((v) => v.languageTag === "en")!.pattern![0]! as Text).value =
			"Hello World 2"
		const message2 = query.get({ where: { id: "first-message" } })!

		expect(
			(message1.variants.find((v) => v.languageTag === "en")!.pattern![0]! as Text).value
		).toBe("Hello World 2")
		expect(
			(message2.variants.find((v) => v.languageTag === "en")!.pattern![0]! as Text).value
		).toBe("Hello World")
	})
})

describe("getAll", async () => {
	it("should return an empty array if no messages exist", async () => {
		const query = await awaitableCreateMessageQuery(() => [])
		const messages = query.getAll()

		expect(Object.values(messages!)).toEqual([])
	})

	it("should return all message objects", async () => {
		const query = await awaitableCreateMessageQuery(() => [])
		const mockMessage1 = createMessage("first-message", { en: "Hello World" })
		const mockMessage2 = createMessage("second-message", { en: "Hello World 2" })
		query.create({ data: mockMessage1 })
		query.create({ data: mockMessage2 })

		const messages = query.getAll()
		expect(Object.values(messages!)).toEqual([mockMessage1, mockMessage2])
	})

	// todo: improve the readonly type
	it.skip("mutating the returned value should not affect subsequent return values", async () => {
		const query = await awaitableCreateMessageQuery(() => [
			createMessage("first-message", { en: "Hello World" }),
		])

		const messages1 = query.getAll()
		;(
			Object.values(messages1!)[0]!.variants.find((v) => v.languageTag === "en")!
				.pattern![0]! as Text
		).value = "Hello World 2"

		expect(
			(
				Object.values(query.getAll()!)[0]!.variants.find((v) => v.languageTag === "en")!
					.pattern![0]! as Text
			).value
		).toBe("Hello World")
	})
})

describe("update", async () => {
	it("should update a message", async () => {
		const query = await awaitableCreateMessageQuery(() => [
			createMessage("first-message", { en: "Hello World" }),
		])

		expect(query.get({ where: { id: "first-message" } })).toBeDefined()

		const mockMessage = createMessage("first-message", { en: "Hello World 2" })
		const updated = query.update({ where: { id: "first-message" }, data: mockMessage })

		expect(query.get({ where: { id: "first-message" } })).toEqual(mockMessage)
		expect(updated).toBe(true)
	})

	it("should return false if message with id does not exist exists", async () => {
		const query = await awaitableCreateMessageQuery(() => [])
		expect(query.get({ where: { id: "first-message" } })).toBeUndefined()

		const mockMessage = createMessage("first-message", { en: "Hello World" })
		const updated = query.update({ where: { id: "first-message" }, data: mockMessage })
		expect(updated).toBe(false)
	})
})

describe("upsert", async () => {
	it("should create a message if not present yet", async () => {
		const query = await awaitableCreateMessageQuery(() => [])
		expect(query.get({ where: { id: "first-message" } })).toBeUndefined()

		const mockMessage = createMessage("first-message", { en: "Hello World" })
		const upserted = query.upsert({ where: { id: "first-message" }, data: mockMessage })

		expect(query.get({ where: { id: "first-message" } })).toEqual(mockMessage)
		expect(upserted).toBe(true)
	})

	it("should update message if id already exists", async () => {
		const query = await awaitableCreateMessageQuery(() => [
			createMessage("first-message", { en: "Hello World" }),
		])
		expect(query.get({ where: { id: "first-message" } })).toBeDefined()

		const mockMessageInit = createMessage("first-message", { en: "Hello World" })
		query.create({ data: mockMessageInit })

		expect(query.get({ where: { id: "first-message" } })).toBeDefined()

		const mockMessage = createMessage("first-message", { en: "Hello World 2" })
		const upserted = query.upsert({ where: { id: "first-message" }, data: mockMessage })

		expect(query.get({ where: { id: "first-message" } })).toEqual(mockMessage)
		expect(upserted).toBe(true)
	})
})

describe("delete", async () => {
	it("should delete a message", async () => {
		const query = await awaitableCreateMessageQuery(() => [
			createMessage("first-message", { en: "Hello World" }),
		])

		expect(query.get({ where: { id: "first-message" } })).toBeDefined()

		const deleted = query.delete({ where: { id: "first-message" } })

		expect(query.get({ where: { id: "first-message" } })).toBeUndefined()
		expect(deleted).toBe(true)
	})

	it("should return false if message with id does not exist", async () => {
		const query = await awaitableCreateMessageQuery(() => [])
		expect(query.get({ where: { id: "first-message" } })).toBeUndefined()

		const deleted = query.delete({ where: { id: "first-message" } })
		expect(deleted).toBe(false)
	})
})

describe("reactivity", async () => {
	describe("get", async () => {
		it("should react to `create`", async () => {
			await createRoot(async () => {
				const query = await awaitableCreateMessageQuery(() => [])

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
				const query = await awaitableCreateMessageQuery(() => [
					createMessage("1", { en: "before" }),
				])

				let message: Message | undefined
				await createChangeListener(() => (message = query.get({ where: { id: "1" } })))
				expect(message).toBeDefined()
				expect(
					(message?.variants.find((variant) => variant.languageTag === "en")?.pattern[0] as Text)
						.value
				).toBe("before")

				query.update({ where: { id: "1" }, data: createMessage("1", { en: "after" }) })
				expect(
					(message?.variants.find((variant) => variant.languageTag === "en")?.pattern[0] as Text)
						.value
				).toBe("after")
			})
		})

		it("should react to `upsert`", async () => {
			await createRoot(async () => {
				const query = await awaitableCreateMessageQuery(() => [])

				let message: Message | undefined
				await createChangeListener(() => (message = query.get({ where: { id: "1" } })))
				expect(message).toBeUndefined()

				query.upsert({ where: { id: "1" }, data: createMessage("1", { en: "before" }) })
				expect(message).toBeDefined()
				expect(
					(message?.variants.find((variant) => variant.languageTag === "en")?.pattern[0] as Text)
						.value
				).toBe("before")

				query.upsert({ where: { id: "1" }, data: createMessage("1", { en: "after" }) })
				expect(
					(message?.variants.find((variant) => variant.languageTag === "en")?.pattern[0] as Text)
						.value
				).toBe("after")
			})
		})

		it("should react to `delete`", async () => {
			await createRoot(async () => {
				const query = await awaitableCreateMessageQuery(() => [createMessage("1", { en: "" })])

				let message: Message | undefined
				await createChangeListener(() => (message = query.get({ where: { id: "1" } })))
				expect(message).toBeDefined()

				query.delete({ where: { id: "1" } })
				expect(message).toBeUndefined()
			})
		})
	})

	describe("subscribe", async () => {
		describe("get", async () => {
			it("should subscribe to `create`", async () => {
				await createRoot(async () => {
					const query = await awaitableCreateMessageQuery(() => [])

					// eslint-disable-next-line unicorn/no-null
					let message: Message | undefined | null = null
					query.get.subscribe({ where: { id: "1" } }, (v) => {
						void (message = v)
					})
					await nextTick()
					expect(message).toBeUndefined()

					query.create({ data: createMessage("1", { en: "before" }) })
					expect(message).toBeDefined()
				})
			})
		})
		describe("getByDefaultAlias", async () => {
			it("should subscribe to `create`", async () => {
				await createRoot(async () => {
					const query = await awaitableCreateMessageQuery(() => [])

					// eslint-disable-next-line unicorn/no-null
					let message: Message | undefined | null = null
					query.getByDefaultAlias.subscribe("message-alias", (v) => {
						void (message = v)
					})
					await nextTick() // required for effect to run on reactive map
					expect(message).toBeUndefined()

					const mockMessage = createMessage("1", { en: "before" })
					mockMessage.alias = { default: "message-alias" }
					query.create({ data: mockMessage })

					expect(message).toBeDefined()
				})
			})
		})
	})

	describe("getAll", async () => {
		it("should react to `create`", async () => {
			await createRoot(async () => {
				const query = await awaitableCreateMessageQuery(() => [])

				let messages: Readonly<Message[]> | undefined = undefined
				await createChangeListener(() => (messages = query.getAll()))
				expect(Object.values(messages!)).toHaveLength(0)

				query.create({ data: createMessage("1", { en: "before" }) })
				expect(Object.values(messages!)).toHaveLength(1)

				query.create({ data: createMessage("2", { en: "before" }) })
				expect(Object.values(messages!)).toHaveLength(2)

				query.create({ data: createMessage("3", { en: "before" }) })
				expect(Object.values(messages!)).toHaveLength(3)
			})
		})

		it("should react to `update`", async () => {
			await createRoot(async () => {
				const query = await awaitableCreateMessageQuery(() => [
					createMessage("1", { en: "before" }),
				])

				let messages: Readonly<Message[]> | undefined = undefined
				await createChangeListener(() => (messages = query.getAll()))
				expect(Object.values(messages!)).toHaveLength(1)
				expect(
					(
						Object.values(messages!)![0]!.variants.find((variant) => variant.languageTag === "en")!
							.pattern[0]! as Text
					).value
				).toBe("before")

				query.update({ where: { id: "1" }, data: createMessage("1", { en: "after" }) })
				expect(Object.values(messages!)).toHaveLength(1)
				expect(
					(
						Object.values(messages!)![0]!.variants.find((variant) => variant.languageTag === "en")!
							.pattern[0]! as Text
					).value
				).toBe("after")
			})
		})

		it("should react to `upsert`", async () => {
			await createRoot(async () => {
				const query = await awaitableCreateMessageQuery(() => [])

				let messages: Readonly<Message[]> | undefined = undefined
				await createChangeListener(() => (messages = query.getAll()))
				expect(Object.values(messages!)).toHaveLength(0)

				query.upsert({ where: { id: "1" }, data: createMessage("1", { en: "before" }) })
				expect(Object.values(messages!)).toHaveLength(1)
				expect(
					(
						Object.values(messages!)![0]!.variants.find((variant) => variant.languageTag === "en")!
							.pattern[0]! as Text
					).value
				).toBe("before")

				query.upsert({ where: { id: "1" }, data: createMessage("1", { en: "after" }) })
				expect(
					(
						Object.values(messages!)![0]!.variants.find((variant) => variant.languageTag === "en")!
							.pattern[0]! as Text
					).value
				).toBe("after")
			})
		})

		it("should react to `delete`", async () => {
			await createRoot(async () => {
				const query = await awaitableCreateMessageQuery(() => [
					createMessage("1", { en: "" }),
					createMessage("2", { en: "" }),
					createMessage("3", { en: "" }),
				])

				let messages: Readonly<Message[]> | undefined = undefined
				await createChangeListener(() => (messages = query.getAll()))
				expect(Object.values(messages!)).toHaveLength(3)

				query.delete({ where: { id: "1" } })
				expect(Object.values(messages!)).toHaveLength(2)

				// deleting the same id again should not have an effect
				query.delete({ where: { id: "1" } })
				expect(Object.values(messages!)).toHaveLength(2)

				query.delete({ where: { id: "2" } })
				expect(Object.values(messages!)).toHaveLength(1)

				query.delete({ where: { id: "3" } })
				expect(Object.values(messages!)).toHaveLength(0)
			})
		})

		it("should not mutate messages signal outside the query when using the query", async () => {
			const [inputMessages] = createSignal<Message[]>([createMessage("1", { en: "before" })])
			const query = await awaitableCreateMessageQuery(inputMessages)

			let messages: Readonly<Message[]> | undefined = undefined
			await createChangeListener(() => (messages = query.getAll()))
			expect(Object.values(messages!)).toHaveLength(1)

			query.create({ data: createMessage("2", { en: "" }) })

			expect(inputMessages().length).toBe(1)
		})
	})
})

it("instances should not share state", async () => {
	await createRoot(async () => {
		const query1 = await awaitableCreateMessageQuery(() => [createMessage("1", { en: "before" })])
		const query2 = await awaitableCreateMessageQuery(() => [])

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
				.value
		).toBe("after")
		expect(
			(message2!.variants.find((variant) => variant.languageTag === "en")!.pattern[0]! as Text)
				.value
		).toBe("before")

		query1.delete({ where: { id: "1" } })
		expect(message1).toBeUndefined()
		expect(message2).toBeDefined()
	})
})
