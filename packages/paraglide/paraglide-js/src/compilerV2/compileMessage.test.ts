import { it, expect } from "vitest"
import { compileMessage } from "./compileMessage.js"

it("should throw if a message uses `-` because `-` are invalid JS function names", () => {
	expect(() =>
		compileMessage(
			{
				id: "message-with-invalid-js-variable-name",
				alias: {},
				selectors: [],
				variants: [],
			},
			{ en: undefined }
		)
	).toThrow()
})

it("should throw an error if a message has multiple variants with the same language tag", () => {
	expect(() =>
		compileMessage(
			{
				id: "duplicateLanguageTag",
				alias: {},
				selectors: [],
				variants: [
					{
						match: [],
						languageTag: "en",
						pattern: [],
					},
					{
						match: [],
						languageTag: "en",
						pattern: [],
					},
				],
			},
			{ en: undefined }
		)
	).toThrow()
})

it("should compile a message with a language tag that contains a hyphen - to an underscore to prevent invalid JS imports", async () => {
	const result = compileMessage(
		{
			id: "login_button",
			alias: {},
			selectors: [],
			variants: [
				{
					match: [],
					languageTag: "en-US",
					pattern: [],
				},
			],
		},
		{ "en-US": undefined }
	)
	expect(result.translations.en_US).toBeUndefined()
	expect(result.translations["en-US"]).toBeDefined()
	expect(result.index.includes("en_US.login_button")).toBe(true)
	expect(result.index.includes("en-US.login_button")).toBe(false)
})

it("should compile a message to a function", async () => {
	const result = compileMessage(
		{
			id: "multipleParams",
			alias: {},
			selectors: [],
			variants: [
				{
					match: [],
					languageTag: "en",
					pattern: [
						{
							type: "Text",
							value: "Hello ",
						},
						{
							type: "VariableReference",
							name: "name",
						},
						{
							type: "Text",
							value: "! You have ",
						},
						{
							type: "VariableReference",
							name: "count",
						},
						{
							type: "Text",
							value: " messages.",
						},
					],
				},
				{
					match: [],
					languageTag: "de",
					pattern: [
						{
							type: "Text",
							value: "Hallo ",
						},
						{
							type: "VariableReference",
							name: "name",
						},
						{
							type: "Text",
							value: "! Du hast ",
						},
						{
							type: "VariableReference",
							name: "count",
						},
						{
							type: "Text",
							value: " Nachrichten.",
						},
					],
				},
			],
		},
		{
			de: "en",
			en: undefined,
		}
	)
	const de = await import(
		`data:application/javascript;base64,${btoa(
			"let languageTag = () => 'de';" + result.translations.de
		)}`
	)
	const en = await import(
		`data:application/javascript;base64,${btoa(
			"let languageTag = () => 'en';" + result.translations.en
		)}`
	)
	expect(de.multipleParams({ name: "Samuel", count: 5 })).toBe(
		"Hallo Samuel! Du hast 5 Nachrichten."
	)
	expect(en.multipleParams({ name: "Samuel", count: 5 })).toBe("Hello Samuel! You have 5 messages.")
})

it("should add a /* @__NO_SIDE_EFFECTS__ */ comment to the compiled message", async () => {
	const result = compileMessage(
		{
			id: "some_message",
			alias: {},
			selectors: [],
			variants: [
				{
					match: [],
					languageTag: "en",
					pattern: [{ type: "Text", value: "Hello world" }],
				},
			],
		},
		{ en: undefined }
	)

	expect(result.index.includes("/* @__NO_SIDE_EFFECTS__ */")).toBe(true)
	expect(result.translations.en?.includes("/* @__NO_SIDE_EFFECTS__ */")).toBe(true)
})

it("should re-export the message from a fallback language tag if the message is missing in the current language tag", async () => {
	const result = compileMessage(
		{
			id: "some_message",
			alias: {},
			selectors: [],
			variants: [
				{
					match: [],
					languageTag: "en",
					pattern: [{ type: "Text", value: "Hello world" }],
				},
			],
		},
		{
			de: "en",
			en: undefined,
		}
	)

	expect(result.translations.de?.includes('export { some_message } from "./en.js"')).toBe(true)
})

it("should return the message ID if no fallback can be found", async () => {
	const result = compileMessage(
		{
			id: "some_message",
			alias: {},
			selectors: [],
			variants: [
				{
					match: [],
					languageTag: "de",
					pattern: [{ type: "Text", value: "Etwas Text" }],
				},
			],
		},
		{
			de: "en",
			en: undefined,
		}
	)

	expect(result.translations.en?.includes('export const some_message = () => "some_message"')).toBe(
		true
	)
})

it("should inclide aliases for messages", async () => {
	const result = compileMessage(
		{
			id: "some_message",
			alias: {
				default: "some_message_alias",
			},
			selectors: [],
			variants: [
				{
					match: [],
					languageTag: "en",
					pattern: [{ type: "Text", value: "Etwas Text" }],
				},
			],
		},
		{
			de: "en",
			en: undefined,
		}
	)

	expect(result.translations.en?.includes("export const some_message_alias")).toBe(true)
})

it("should include aliases for messages from a fallback language", async () => {
	const result = compileMessage(
		{
			id: "some_message",
			alias: {
				default: "some_message_alias",
			},
			selectors: [],
			variants: [
				{
					match: [],
					languageTag: "de",
					pattern: [{ type: "Text", value: "Etwas Text" }],
				},
			],
		},
		{
			de: undefined,
			en: "de",
		}
	)

	expect(result.translations.en?.includes("some_message_alias")).toBe(true)
})

it("should inclide aliases for fallback messages", async () => {
	const result = compileMessage(
		{
			id: "some_message",
			alias: {
				default: "some_message_alias",
			},
			selectors: [],
			variants: [
				{
					match: [],
					languageTag: "de",
					pattern: [{ type: "Text", value: "Etwas Text" }],
				},
			],
		},
		{
			de: "en",
			en: undefined,
		}
	)

	expect(result.translations.en?.includes("some_message_alias")).toBe(true)
})
