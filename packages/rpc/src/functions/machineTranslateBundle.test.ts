import { expect, test } from "vitest"
import { machineTranslateBundle } from "./machineTranslateBundle.js"
import type { BundleNested } from "@inlang/sdk2"
import { ENV_VARIABLES } from "../services/env-variables/index.js"

test.runIf(ENV_VARIABLES.GOOGLE_TRANSLATE_API_KEY)(
	"it should machine translate to all provided target locales and variants",
	async () => {
		const result = await machineTranslateBundle({
			sourceLocale: "en",
			targetLocales: ["de", "fr", "en"],
			bundle: {
				id: "mock-bundle-id",
				declarations: [],
				messages: [
					{
						id: "mock-message-id",
						bundleId: "mock-bundle-id",
						locale: "en",
						selectors: [],
						variants: [
							{
								id: "mock-variant-id-name-john",
								messageId: "mock-message-id",
								matches: [
									{
										type: "match",
										name: "name",
										value: {
											type: "literal",
											value: "John",
										},
									},
								],
								pattern: [{ type: "text", value: "Hello world, John" }],
							},
							{
								id: "mock-variant-id-*",
								messageId: "mock-message-id",
								matches: [
									{
										type: "match",
										name: "name",
										value: {
											type: "catch-all",
										},
									},
								],
								pattern: [{ type: "text", value: "Hello world" }],
							},
						],
					},
				],
			} as BundleNested,
		})

		const bundle = result.data
		const messages = result.data?.messages
		const variants = messages?.flatMap((m) => m.variants)

		expect(bundle).toBeDefined()
		expect(messages).toHaveLength(3)
		expect(variants).toHaveLength(6)

		const messageIds = messages?.map((m) => m.id)
		const variantIds = variants?.map((v) => v.id)

		// unique ids
		expect(messageIds?.length).toEqual(new Set(messageIds).size)
		expect(variantIds?.length).toEqual(new Set(variantIds).size)

		// every variant id should be in the message ids
		expect(variants?.every((variant) => messageIds?.includes(variant.messageId))).toBe(true)

		// every message should have the same bundle id
		expect(messages?.every((message) => message.bundleId === bundle?.id)).toBe(true)

		expect(messages).toStrictEqual(
			expect.arrayContaining([
				// the base message should be unmodified
				expect.objectContaining({
					id: "mock-message-id",
					locale: "en",
				}),
				// a german message should exist after translation
				expect.objectContaining({
					locale: "de",
				}),
				// a french message should exist after translation
				expect.objectContaining({
					locale: "fr",
				}),
			])
		)

		expect(variants).toStrictEqual(
			expect.arrayContaining([
				// the english variant should be identical
				expect.objectContaining({
					id: "mock-variant-id-name-john",
					messageId: "mock-message-id",
					matches: [
						{
							type: "match",
							name: "name",
							value: {
								type: "literal",
								value: "John",
							},
						},
					],
					pattern: [{ type: "text", value: "Hello world, John" }],
				}),
				expect.objectContaining({
					id: "mock-variant-id-*",
					messageId: "mock-message-id",
					matches: [
						{
							type: "match",
							name: "name",
							value: {
								type: "catch-all",
							},
						},
					],
					pattern: [{ type: "text", value: "Hello world" }],
				}),
				// a german variant should exist
				expect.objectContaining({
					matches: [
						{
							type: "match",
							name: "name",
							value: {
								type: "literal",
								value: "John",
							},
						},
					],
					pattern: [{ type: "text", value: "Hallo Welt, John" }],
				}),
				expect.objectContaining({
					matches: [
						{
							type: "match",
							name: "name",
							value: {
								type: "catch-all",
							},
						},
					],
					pattern: [{ type: "text", value: "Hallo Welt" }],
				}),
				// a french variant should exist
				expect.objectContaining({
					matches: [
						{
							type: "match",
							name: "name",
							value: {
								type: "literal",
								value: "John",
							},
						},
					],
					pattern: [{ type: "text", value: "Bonjour tout le monde, John" }],
				}),
				expect.objectContaining({
					matches: [
						{
							type: "match",
							name: "name",
							value: {
								type: "catch-all",
							},
						},
					],
					pattern: [{ type: "text", value: "Bonjour le monde" }],
				}),
			])
		)
	}
)

test.runIf(ENV_VARIABLES.GOOGLE_TRANSLATE_API_KEY)(
	"should escape expressions in patterns",
	async () => {
		const result = await machineTranslateBundle({
			sourceLocale: "en",
			targetLocales: ["de"],
			bundle: {
				id: "mock-bundle-id",
				declarations: [],
				messages: [
					{
						id: "mock-message-id",
						bundleId: "mock-bundle-id",
						locale: "en",
						selectors: [],
						variants: [
							{
								id: "mock-variant-id",
								messageId: "mock-message-id",
								matches: [],
								pattern: [
									{ type: "text", value: "There are " },
									{ type: "expression", arg: { type: "variable", name: "num" } },
									{ type: "text", value: " cars on the street." },
								],
							},
						],
					},
				],
			} as BundleNested,
		})

		const messages = result.data?.messages
		const variants = messages?.flatMap((m) => m.variants)

		expect(messages).toStrictEqual(
			expect.arrayContaining([
				// the base message should be unmodified
				expect.objectContaining({
					id: "mock-message-id",
					locale: "en",
				}),
				// a german message should exist after translation
				expect.objectContaining({
					locale: "de",
				}),
			])
		)

		expect(variants).toStrictEqual(
			expect.arrayContaining([
				// the english variant should be identical
				expect.objectContaining({
					pattern: [
						{ type: "text", value: "There are " },
						{ type: "expression", arg: { type: "variable", name: "num" } },
						{ type: "text", value: " cars on the street." },
					],
				}),
				// a german variant should exist
				expect.objectContaining({
					pattern: [
						{ type: "text", value: "Es sind " },
						{ type: "expression", arg: { type: "variable", name: "num" } },
						{ type: "text", value: " Autos auf der Straße." },
					],
				}),
			])
		)
	}
)

// test.todo("should not naively compare the variant lengths and instead match variants", async () => {
// 	const result = await machineTranslateBundle({
// 		sourceLocale: "en",
// 		targetLocales: ["de"],
// 		bundle: {
// 			id: "mockBundle",
// 			alias: {},
// 			messages: [
// 				{
// 					id: "mockMessage",
// 					bundleId: "mockBundle",
// 					locale: "en",
// 					declarations: [],
// 					selectors: [
// 						{
// 							type: "expression",
// 							arg: {
// 								type: "variable",
// 								name: "gender",
// 							},
// 						},
// 					],
// 					variants: [
// 						{
// 							id: "internal-dummy-id",
// 							messageId: "dummy-id",
// 							match: { gender: "male" },
// 							pattern: [{ type: "text", value: "Gender male" }],
// 						},
// 						{
// 							id: "internal-dummy-id",
// 							messageId: "dummy-id",
// 							match: { gender: "*" },
// 							pattern: [{ type: "text", value: "Veraltete Übersetzung" }],
// 						},
// 					],
// 				},
// 			],
// 		} as BundleNested,
// 	})
// 	expect(result.error).toBeUndefined()
// 	expect(result.data).toEqual({
// 		id: "mockMessage",
// 		alias: {},
// 		selectors: [
// 			{
// 				type: "variable",
// 				name: "gender",
// 			},
// 		],
// 		variants: [
// 			{
// 				id: "internal-dummy-id",
// 				messageId: "dummy-id",
// 				match: { gender: "male" },
// 				pattern: [{ type: "text", value: "Gender male" }],
// 			},
// 			{
// 				id: "internal-dummy-id",
// 				messageId: "dummy-id",
// 				match: { gender: "*" },
// 				pattern: [{ type: "text", value: "Veraltete Übersetzung" }],
// 			},
// 			{
// 				id: "internal-dummy-id",
// 				messageId: "dummy-id",
// 				match: { gender: "male" },
// 				pattern: [{ type: "text", value: "Geschlecht männlich" }],
// 			},
// 		] as Variant[],
// 	})
// })

test.runIf(ENV_VARIABLES.GOOGLE_TRANSLATE_API_KEY)(
	"should keep line breaks in multiline translations",
	async () => {
		const result = await machineTranslateBundle({
			sourceLocale: "en",
			targetLocales: ["de"],
			bundle: {
				id: "mockBundle",
				declarations: [],
				messages: [
					{
						id: "mockMessage",
						bundleId: "mockBundle",
						locale: "en",
						selectors: [],
						variants: [
							{
								id: "internal-dummy-id",
								messageId: "dummy-id",
								matches: [],
								pattern: [
									{
										type: "text",
										value: "This is a\nmultiline\ntranslation.",
									},
								],
							},
						],
					},
				],
			},
		})
		const messages = result.data?.messages
		const variants = messages?.flatMap((m) => m.variants)

		expect(variants).toStrictEqual(
			expect.arrayContaining([
				// the english variant should be identical
				expect.objectContaining({
					pattern: [{ type: "text", value: "This is a\nmultiline\ntranslation." }],
				}),
				// a german variant should exist
				expect.objectContaining({
					pattern: [{ type: "text", value: "Dies ist ein\nmehrzeilig\nÜbersetzung." }],
				}),
			])
		)
	}
)
