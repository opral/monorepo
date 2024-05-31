import { test, expect } from "vitest"
import * as V2 from "./types.js"
import * as V1 from "@inlang/message"
import { createMessageBundle, createMessage } from "./helper.js"
import { toV1Message, fromV1Message } from "./shim.js"
import { Value } from "@sinclair/typebox/value"

const bundle = createMessageBundle({
	id: "hello_world",
	messages: [
		createMessage({ locale: "en", text: "Hello World!" }),
		createMessage({ locale: "de", text: "Hallo Welt!" }),
	],
})

test("toV1Message and fromV1Message", () => {
	expect(Value.Check(V2.MessageBundle, bundle)).toBe(true)

	const v1Message: unknown = toV1Message(bundle)
	expect(Value.Check(V1.Message, v1Message)).toBe(true)

	expect(v1Message).toEqual({
		id: "hello_world",
		alias: {},
		variants: [
			{
				languageTag: "en",
				match: [],
				pattern: [
					{
						type: "Text",
						value: "Hello World!",
					},
				],
			},
			{
				languageTag: "de",
				match: [],
				pattern: [
					{
						type: "Text",
						value: "Hallo Welt!",
					},
				],
			},
		],
		selectors: [],
	})

	const v2MessageBundle: unknown = fromV1Message(v1Message as V1.Message)
	expect(Value.Check(V2.MessageBundle, v2MessageBundle)).toBe(true)

	expect(v2MessageBundle).toEqual(bundle)
})

test.todo("with variable references", () => {})
