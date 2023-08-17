import { it, expect } from "vitest"
import { privateEnv } from "@inlang/env-variables"
import { machineTranslateMessage } from "./machineTranslateMessage.js"
import type { Message } from "@inlang/messages"

it.runIf(privateEnv.GOOGLE_TRANSLATE_API_KEY)(
	"should translate multiple target language tags",
	async () => {
		const result = await machineTranslateMessage({
			sourceLanguageTag: "en",
			targetLanguageTags: ["de", "fr"],
			message: {
				id: "mockMessage",
				selectors: [],
				body: {
					en: [{ pattern: [{ type: "Text", value: "Hello world" }], match: {} }],
				},
			},
		})
		expect(result.error).toBeUndefined()
		expect(result.data).toEqual({
			id: "mockMessage",
			selectors: [],
			body: {
				en: [{ pattern: [{ type: "Text", value: "Hello world" }], match: {} }],
				de: [{ pattern: [{ type: "Text", value: "Hallo Welt" }], match: {} }],
				fr: [{ pattern: [{ type: "Text", value: "Bonjour le monde" }], match: {} }],
			},
		})
	},
)

it.runIf(privateEnv.GOOGLE_TRANSLATE_API_KEY)(
	"should escape pattern elements that are not Text",
	async () => {
		const result = await machineTranslateMessage({
			sourceLanguageTag: "en",
			targetLanguageTags: ["de"],
			message: {
				id: "mockMessage",
				selectors: [],
				body: {
					en: [
						{
							pattern: [
								{ type: "Text", value: "Good evening " },
								{ type: "VariableReference", name: "username" },
								{ type: "Text", value: ", what a beautiful sunset." },
							],
							match: {},
						},
					],
				},
			},
		})
		expect(result.error).toBeUndefined()
		expect(result.data).toEqual({
			id: "mockMessage",
			selectors: [],
			body: {
				en: [
					{
						pattern: [
							{ type: "Text", value: "Good evening " },
							{ type: "VariableReference", name: "username" },
							{ type: "Text", value: ", what a beautiful sunset." },
						],
						match: {},
					},
				],
				de: [
					{
						pattern: [
							{ type: "Text", value: "Guten Abend " },
							{ type: "VariableReference", name: "username" },
							{ type: "Text", value: " , was für ein wunderschöner Sonnenuntergang." },
						],
						match: {},
					},
				],
			},
		} satisfies Message)
	},
)

it.runIf(privateEnv.GOOGLE_TRANSLATE_API_KEY)(
	"should not naively compare the variant lenghts and instead match variants",
	async () => {
		const result = await machineTranslateMessage({
			sourceLanguageTag: "en",
			targetLanguageTags: ["de"],
			message: {
				id: "mockMessage",
				selectors: [],
				body: {
					en: [
						{
							pattern: [{ type: "Text", value: "Gender male" }],
							match: {
								gender: "male",
							},
						},
					],
					de: [
						{
							pattern: [{ type: "Text", value: "Veraltete Übersetzung" }],
							match: {},
						},
					],
				},
			},
		})
		expect(result.error).toBeUndefined()
		expect(result.data).toEqual({
			id: "mockMessage",
			selectors: [],
			body: {
				en: [
					{
						pattern: [{ type: "Text", value: "Gender male" }],
						match: {
							gender: "male",
						},
					},
				],
				de: [
					{
						pattern: [{ type: "Text", value: "Veraltete Übersetzung" }],
						match: {},
					},
					{
						pattern: [{ type: "Text", value: "Geschlecht männlich" }],
						match: {
							gender: "male",
						},
					},
				],
			},
		})
	},
)

it.runIf(privateEnv.GOOGLE_TRANSLATE_API_KEY)(
	"should not return escaped quotation marks",
	async () => {
		const result = await machineTranslateMessage({
			sourceLanguageTag: "en",
			targetLanguageTags: ["de"],
			message: {
				id: "mockMessage",
				selectors: [],
				body: {
					en: [
						{
							pattern: [
								{ type: "Text", value: "'" },
								{ type: "VariableReference", name: "id" },
								{ type: "Text", value: "' added a new todo" },
							],
							match: {},
						},
					],
				},
			},
		})
		expect(result.error).toBeUndefined()
		expect(result.data).toEqual({
			id: "mockMessage",
			selectors: [],
			body: {
				en: [
					{
						pattern: [
							{ type: "Text", value: "'" },
							{ type: "VariableReference", name: "id" },
							{ type: "Text", value: "' added a new todo" },
						],
						match: {},
					},
				],
				de: [
					{
						pattern: [
							{ type: "Text", value: "' " },
							{ type: "VariableReference", name: "id" },
							{ type: "Text", value: " ' hat eine neue Aufgabe hinzugefügt" },
						],
						match: {},
					},
				],
			},
		})
	},
)
