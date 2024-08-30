import { it, expect } from "vitest"
import { privateEnv } from "@inlang/env-variables"
import { machineTranslateMessage } from "./machineTranslateMessage.js"
import type { Variant, BundleNested } from "@inlang/sdk2"

it.runIf(privateEnv.GOOGLE_TRANSLATE_API_KEY)(
	"should translate multiple target locales",
	async () => {
		const result = await machineTranslateMessage({
			baseLocale: "en",
			targetLocales: ["de", "fr"],
			bundle: {
				id: "mockBundle",
				alias: {},
				messages: [
					{
						id: "mockMessage",
						bundleId: "mockBundle",
						locale: "en",
						declarations: [],
						selectors: [],
						variants: [
							{
								id: "internal-dummy-id",
								messageId: "dummy-id",
								match: {},
								pattern: [{ type: "text", value: "Hello world" }],
							},
						],
					},
				],
			} as BundleNested,
		})
		expect(result.error).toBeUndefined()
		expect(result.data).toEqual({
			id: "mockMessage",
			alias: {},
			selectors: [],
			variants: [
				{
					id: "internal-dummy-id",
					messageId: "dummy-id",
					match: {},
					pattern: [{ type: "text", value: "Hello world" }],
				},
				{
					id: "internal-dummy-id",
					messageId: "dummy-id",
					match: {},
					pattern: [{ type: "text", value: "Hallo Welt" }],
				},
				{
					id: "internal-dummy-id",
					messageId: "dummy-id",
					match: {},
					pattern: [{ type: "text", value: "Bonjour le monde" }],
				},
			] as Variant[],
		})
	}
)

it.runIf(privateEnv.GOOGLE_TRANSLATE_API_KEY)(
	"should escape pattern elements that are not Text",
	async () => {
		const result = await machineTranslateMessage({
			baseLocale: "en",
			targetLocales: ["de"],
			bundle: {
				id: "mockBundle",
				alias: {},
				messages: [
					{
						id: "mockMessage",
						bundleId: "mockBundle",
						locale: "en",
						declarations: [],
						selectors: [],
						variants: [
							{
								id: "internal-dummy-id",
								messageId: "dummy-id",
								match: {},
								pattern: [
									{ type: "text", value: "Good evening" },
									{
										type: "expression",
										arg: {
											type: "variable",
											name: "username",
										},
										annotation: {
											type: "function",
											name: "username",
											options: [
												{
													name: "username",
													value: {
														type: "variable",
														name: "username",
													},
												},
											],
										},
									},
									{ type: "text", value: ", what a beautiful sunset." },
								],
							},
						],
					},
				],
			} as BundleNested,
		})
		expect(result.error).toBeUndefined()
		expect(result.data).toEqual({
			id: "mockMessage",
			alias: {},
			selectors: [],
			variants: [
				{
					id: "internal-dummy-id",
					messageId: "dummy-id",
					match: {},
					pattern: [
						{ type: "text", value: "Good evening" },
						{
							type: "expression",
							arg: {
								type: "variable",
								name: "username",
							},
							annotation: {
								type: "function",
								name: "username",
								options: [
									{
										name: "username",
										value: {
											type: "variable",
											name: "username",
										},
									},
								],
							},
						},
						{ type: "text", value: ", what a beautiful sunset." },
					],
				},
				{
					id: "internal-dummy-id",
					messageId: "dummy-id",
					match: {},
					pattern: [
						{ type: "text", value: "Guten Abend" },
						{
							type: "expression",
							arg: {
								type: "variable",
								name: "username",
							},
							annotation: {
								type: "function",
								name: "username",
								options: [
									{
										name: "username",
										value: {
											type: "variable",
											name: "username",
										},
									},
								],
							},
						},
						{ type: "text", value: ", was für ein schöner Sonnenuntergang." },
					],
				},
			] as Variant[],
		})
	}
)

it.todo("should not naively compare the variant lengths and instead match variants", async () => {
	const result = await machineTranslateMessage({
		baseLocale: "en",
		targetLocales: ["de"],
		bundle: {
			id: "mockBundle",
			alias: {},
			messages: [
				{
					id: "mockMessage",
					bundleId: "mockBundle",
					locale: "en",
					declarations: [],
					selectors: [
						{
							type: "expression",
							arg: {
								type: "variable",
								name: "gender",
							},
						},
					],
					variants: [
						{
							id: "internal-dummy-id",
							messageId: "dummy-id",
							match: { gender: "male" },
							pattern: [{ type: "text", value: "Gender male" }],
						},
						{
							id: "internal-dummy-id",
							messageId: "dummy-id",
							match: { gender: "*" },
							pattern: [{ type: "text", value: "Veraltete Übersetzung" }],
						},
					],
				},
			],
		} as BundleNested,
	})
	expect(result.error).toBeUndefined()
	expect(result.data).toEqual({
		id: "mockMessage",
		alias: {},
		selectors: [
			{
				type: "variable",
				name: "gender",
			},
		],
		variants: [
			{
				id: "internal-dummy-id",
				messageId: "dummy-id",
				match: { gender: "male" },
				pattern: [{ type: "text", value: "Gender male" }],
			},
			{
				id: "internal-dummy-id",
				messageId: "dummy-id",
				match: { gender: "*" },
				pattern: [{ type: "text", value: "Veraltete Übersetzung" }],
			},
			{
				id: "internal-dummy-id",
				messageId: "dummy-id",
				match: { gender: "male" },
				pattern: [{ type: "text", value: "Geschlecht männlich" }],
			},
		] as Variant[],
	})
})

it.runIf(privateEnv.GOOGLE_TRANSLATE_API_KEY)(
	"should not return escaped quotation marks",
	async () => {
		const result = await machineTranslateMessage({
			baseLocale: "en",
			targetLocales: ["de"],
			bundle: {
				id: "mockBundle",
				alias: {},
				messages: [
					{
						id: "mockMessage",
						bundleId: "mockBundle",
						locale: "en",
						declarations: [],
						selectors: [],
						variants: [
							{
								id: "internal-dummy-id",
								messageId: "dummy-id",
								match: {},
								pattern: [
									{ type: "text", value: "'" },
									{ type: "variable", name: "id" },
									{ type: "text", value: "' added a new todo" },
								],
							},
						],
					},
				],
			} as BundleNested,
		})
		expect(result.error).toBeUndefined()
		expect(result.data).toEqual({
			id: "mockMessage",
			alias: {},
			selectors: [],
			variants: [
				{
					id: "internal-dummy-id",
					messageId: "dummy-id",
					match: {},
					pattern: [
						{ type: "text", value: "'" },
						{ type: "variable", name: "id" },
						{ type: "text", value: "' added a new todo" },
					],
				},
				{
					id: "internal-dummy-id",
					messageId: "dummy-id",
					match: {},
					pattern: [
						{ type: "text", value: "' " },
						{ type: "variable", name: "id" },
						{ type: "text", value: " ' hat ein neues To-Do hinzugefügt" },
					],
				},
			] as Variant[],
		})
	}
)

it.runIf(privateEnv.GOOGLE_TRANSLATE_API_KEY)(
	"should not keep line breaks in multiline translations",
	async () => {
		const result = await machineTranslateMessage({
			baseLocale: "en",
			targetLocales: ["de"],
			bundle: {
				id: "mockBundle",
				alias: {},
				messages: [
					{
						id: "mockMessage",
						bundleId: "mockBundle",
						locale: "en",
						declarations: [],
						selectors: [],
						variants: [
							{
								id: "internal-dummy-id",
								messageId: "dummy-id",
								match: {},
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
			} as BundleNested,
		})
		expect(result.error).toBeUndefined()
		expect(result.data).toEqual({
			id: "mockMessage",
			alias: {},
			selectors: [],
			variants: [
				{
					id: "internal-dummy-id",
					messageId: "dummy-id",
					match: {},
					pattern: [{ type: "text", value: "This is a multiline translation." }],
				},
				{
					id: "internal-dummy-id",
					messageId: "dummy-id",
					match: {},
					pattern: [{ type: "text", value: "Dies ist eine mehrzeilige Übersetzung." }],
				},
			] as Variant[],
		})
	}
)
