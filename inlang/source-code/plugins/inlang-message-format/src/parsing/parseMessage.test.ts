import { test, expect } from "vitest"
import { parseMessage } from "./parseMessage.js"
import type { Message } from "@inlang/sdk"

test("it parses a text-only message", async () => {
	const parsed = parseMessage({
		key: "test",
		value: "Hello World!",
		languageTag: "en",
	})

	expect(parsed).toStrictEqual({
		id: "test",
		alias: {},
		selectors: [],
		variants: [
			{
				languageTag: "en",
				match: [],
				pattern: [{ type: "Text", value: "Hello World!" }],
			},
		],
	})
})

test("it parses a message with a variable reference", async () => {
	const parsed = parseMessage({
		key: "test",
		value: "Hello {name}!",
		languageTag: "en",
	})

	expect(parsed).toStrictEqual({
		id: "test",
		alias: {},
		selectors: [],
		variants: [
			{
				languageTag: "en",
				match: [],
				pattern: [
					{ type: "Text", value: "Hello " },
					{ type: "VariableReference", name: "name" },
					{ type: "Text", value: "!" },
				],
			},
		],
	})
})

test("parses a message with a match statement", () => {
	const parsed = parseMessage({
		key: "test",
		value: "match {gender} when female {Hello actress} when * {Hello actor}",
		languageTag: "en",
	})

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

	expect(parsed).toEqual(message)
})

test("parses a message with a number in the match statement", () => {
	const parsed = parseMessage({
		key: "test",
		value:
			"match {messages} when 0 {Du hast keine nachrichten} when * {Du hast {messages} nachrichten}",
		languageTag: "en",
	})

	const message: Message = {
		id: "test",
		alias: {},
		selectors: [
			{
				type: "VariableReference",
				name: "messages",
			},
		],
		variants: [
			{
				match: ["0"],
				languageTag: "en",
				pattern: [{ type: "Text", value: "Du hast keine nachrichten" }],
			},
			{
				match: ["*"],
				languageTag: "en",
				pattern: [
					{ type: "Text", value: "Du hast " },
					{ type: "VariableReference", name: "messages" },
					{ type: "Text", value: " nachrichten" },
				],
			},
		],
	}

	expect(parsed).toEqual(message)
})

test("it parses a message with multiple selectors", () => {
	const parsed = parseMessage({
		key: "test",
		value:
			"match {notifications} {gender} when 0 female {She has no notificactions} when * * {They have {notifications} notificactions}",
		languageTag: "en",
	})

	const message: Message = {
		id: "test",
		alias: {},
		selectors: [
			{
				type: "VariableReference",
				name: "notifications",
			},
			{
				type: "VariableReference",
				name: "gender",
			},
		],
		variants: [
			{
				match: ["0", "female"],
				languageTag: "en",
				pattern: [{ type: "Text", value: "She has no notificactions" }],
			},
			{
				match: ["*", "*"],
				languageTag: "en",
				pattern: [
					{ type: "Text", value: "They have " },
					{ type: "VariableReference", name: "notifications" },
					{ type: "Text", value: " notificactions" },
				],
			},
		],
	}

	expect(parsed).toEqual(message)
})
