import { it, expect } from "vitest"
import { privateEnv } from "@inlang/env-variables"
import { machineTranslateMessage } from "./machineTranslateMessage.js"
import { type Message } from "@inlang/message"

it.runIf(privateEnv.GOOGLE_TRANSLATE_API_KEY)(
	"should translate multiple target language tags",
	async () => {
		const result = await machineTranslateMessage({
			sourceLanguageTag: "en",
			targetLanguageTags: ["de", "fr"],
			message: {
				id: "mockMessage",
				alias: {},
				selectors: [],
				variants: [
					{ languageTag: "en", match: [], pattern: [{ type: "Text", value: "Hello world" }] },
				],
			},
		})
		expect(result.error).toBeUndefined()
		expect(result.data).toEqual({
			id: "mockMessage",
			alias: {},
			selectors: [],
			variants: [
				{ languageTag: "en", match: [], pattern: [{ type: "Text", value: "Hello world" }] },
				{ languageTag: "de", match: [], pattern: [{ type: "Text", value: "Hallo Welt" }] },
				{ languageTag: "fr", match: [], pattern: [{ type: "Text", value: "Bonjour le monde" }] },
			],
		})
	}
)

it.runIf(privateEnv.GOOGLE_TRANSLATE_API_KEY)(
	"should escape pattern elements that are not Text",
	async () => {
		const result = await machineTranslateMessage({
			sourceLanguageTag: "en",
			targetLanguageTags: ["de"],
			message: {
				id: "mockMessage",
				alias: {},
				selectors: [],
				variants: [
					{ languageTag: "en", match: [], pattern: [{ type: "Text", value: "Good evening" }] },
					{
						languageTag: "en",
						match: [],
						pattern: [{ type: "VariableReference", name: "username" }],
					},
					{
						languageTag: "en",
						match: [],
						pattern: [{ type: "Text", value: ", what a beautiful sunset." }],
					},
				],
			},
		})
		expect(result.error).toBeUndefined()
		expect(result.data).toEqual({
			id: "mockMessage",
			alias: {},
			selectors: [],
			variants: [
				{ languageTag: "en", match: [], pattern: [{ type: "Text", value: "Good evening" }] },
				{
					languageTag: "en",
					match: [],
					pattern: [{ type: "VariableReference", name: "username" }],
				},
				{
					languageTag: "en",
					match: [],
					pattern: [{ type: "Text", value: ", what a beautiful sunset." }],
				},
				{ languageTag: "de", match: [], pattern: [{ type: "Text", value: "Guten Abend" }] },
				{
					languageTag: "de",
					match: [],
					pattern: [{ type: "VariableReference", name: "username" }],
				},
				{
					languageTag: "de",
					match: [],
					pattern: [{ type: "Text", value: ", was für ein wunderschöner Sonnenuntergang." }],
				},
			],
		} satisfies Message)
	}
)

it.todo("should not naively compare the variant lenghts and instead match variants", async () => {
	const result = await machineTranslateMessage({
		sourceLanguageTag: "en",
		targetLanguageTags: ["de"],
		message: {
			id: "mockMessage",
			alias: {},
			selectors: [
				{
					type: "VariableReference",
					name: "gender",
				},
			],
			variants: [
				{
					languageTag: "en",
					match: ["male"],
					pattern: [{ type: "Text", value: "Gender male" }],
				},
				{
					languageTag: "de",
					match: ["*"],
					pattern: [{ type: "Text", value: "Veraltete Übersetzung" }],
				},
			],
		},
	})
	expect(result.error).toBeUndefined()
	expect(result.data).toEqual({
		id: "mockMessage",
		alias: {},
		selectors: [
			{
				type: "VariableReference",
				name: "gender",
			},
		],
		variants: [
			{
				languageTag: "en",
				match: ["male"],
				pattern: [{ type: "Text", value: "Gender male" }],
			},
			{
				languageTag: "de",
				match: ["*"],
				pattern: [{ type: "Text", value: "Veraltete Übersetzung" }],
			},
			{
				languageTag: "de",
				match: ["male"],
				pattern: [{ type: "Text", value: "Geschlecht männlich" }],
			},
		],
	})
})

it.runIf(privateEnv.GOOGLE_TRANSLATE_API_KEY)(
	"should not return escaped quotation marks",
	async () => {
		const result = await machineTranslateMessage({
			sourceLanguageTag: "en",
			targetLanguageTags: ["de"],
			message: {
				id: "mockMessage",
				alias: {},
				selectors: [],
				variants: [
					{
						languageTag: "en",
						match: [],
						pattern: [
							{ type: "Text", value: "'" },
							{ type: "VariableReference", name: "id" },
							{ type: "Text", value: "' added a new todo" },
						],
					},
				],
			},
		})
		expect(result.error).toBeUndefined()
		expect(result.data).toEqual({
			id: "mockMessage",
			alias: {},
			selectors: [],
			variants: [
				{
					languageTag: "en",
					match: [],
					pattern: [
						{ type: "Text", value: "'" },
						{ type: "VariableReference", name: "id" },
						{ type: "Text", value: "' added a new todo" },
					],
				},
				{
					languageTag: "de",
					match: [],
					pattern: [
						{ type: "Text", value: "' " },
						{ type: "VariableReference", name: "id" },
						{ type: "Text", value: " ' hat ein neues To-Do hinzugefügt" },
					],
				},
			],
		})
	}
)

it.runIf(privateEnv.GOOGLE_TRANSLATE_API_KEY)(
	"should not keep line breaks in multiline translations",
	async () => {
		const result = await machineTranslateMessage({
			sourceLanguageTag: "en",
			targetLanguageTags: ["de"],
			message: {
				id: "mockMessage",
				alias: {},
				selectors: [],
				variants: [
					{
						languageTag: "en",
						match: [],
						pattern: [
							{
								type: "Text",
								value: "This is a test\r\nwith line break.",
							},
						],
					},
				],
			},
		})
		expect(result.error).toBeUndefined()
		expect(result.data).toEqual({
			id: "mockMessage",
			alias: {},
			selectors: [],
			variants: [
				{
					languageTag: "en",
					match: [],
					pattern: [
						{
							type: "Text",
							value: "This is a test\r\nwith line break.",
						},
					],
				},
				{
					languageTag: "de",
					match: [],
					pattern: [
						{
							type: "Text",
							value: "Das ist ein Test\r\nmit Zeilenumbruch.",
						},
					],
				},
			],
		})
	}
)
