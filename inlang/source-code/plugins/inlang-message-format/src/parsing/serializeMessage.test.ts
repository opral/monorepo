import { test, expect } from "vitest"
import type { Message } from "@inlang/sdk"
import { serializeMessage } from "./serializeMessage.js"

test("it should split the variants into language tags", async () => {
	const message: Message = {
		id: "test",
		alias: {},
		selectors: [],
		variants: [
			{ match: [], languageTag: "en", pattern: [{ type: "Text", value: "Hello" }] },
			{ match: [], languageTag: "de", pattern: [{ type: "Text", value: "Hallo" }] },
		],
	}
	const serialized = serializeMessage(message)
	expect(serialized).toEqual({
		en: "Hello",
		de: "Hallo",
	})
})

test("it should serialize a match statement for multiple variants", async () => {
	const message: Message = {
		id: "test",
		alias: {},
		selectors: [
			{
				type: "VariableReference",
				name: "gender",
			},
		],
		variants: [
			{ match: ["female"], languageTag: "en", pattern: [{ type: "Text", value: "Hello actress" }] },
			{ match: ["*"], languageTag: "en", pattern: [{ type: "Text", value: "Hello actor" }] },
		],
	}
	expect(serializeMessage(message)).toEqual({
		en: "match {gender} when female {Hello actress} when * {Hello actor}",
	})
})

test("it should throw if one variant doesn't provide a match for all selectors", async () => {
	const message: Message = {
		id: "test",
		alias: {},
		selectors: [
			{
				type: "VariableReference",
				name: "gender",
			},
		],
		variants: [
			{ match: ["female"], languageTag: "en", pattern: [{ type: "Text", value: "Hello actress" }] },
			{ match: [], languageTag: "en", pattern: [{ type: "Text", value: "Hello actor" }] },
		],
	}
	expect(() => serializeMessage(message)).toThrow()
})