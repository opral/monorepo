import { describe, it, expect } from "vitest"
// import { parseLixUri, parseOrigin } from "./helpers.js"
import {
	normalizeMessage,
	normalizeMessageBundle,
	stringifyMessage,
	stringifyMessageBundle,
} from "./helper.js"
import type { Message, AST } from "@inlang/message"

const unsortedMessageRaw: Message = {
	alias: {},
	selectors: [],
	id: "footer_categories_apps",
	variants: [
		{ languageTag: "a", match: ["*", "1"], pattern: [{ type: "Text", value: "2" }] },
		{ languageTag: "a", match: ["*", "*"], pattern: [{ type: "Text", value: "1" }] },
		{
			languageTag: "a",
			match: ["1", "*"],
			pattern: [
				{ type: "Text", value: "2" },
				{ type: "Text", value: "2" },
			],
		},
		{ languageTag: "b", match: [], pattern: [{ type: "Text", value: "4" }] },
		{ languageTag: "a", match: ["1", "1"], pattern: [{ type: "Text", value: "2" }] },
		{ languageTag: "c", match: [], pattern: [{ value: "5", type: "Text" }] },
		{ match: [], languageTag: "d", pattern: [{ type: "Text", value: "6" }] },
		{ languageTag: "e", match: [], pattern: [{ type: "Text", value: "7" }] },
		{ languageTag: "f", match: [], pattern: [{ type: "Text", value: "8" }] },
		{ languageTag: "g", match: [], pattern: [{ type: "Text", value: "9" }] },
	],
}

const sortedMessageRaw: Message = {
	alias: {},
	id: "footer_categories_apps",
	selectors: [],
	variants: [
		{ languageTag: "a", match: ["*", "*"], pattern: [{ type: "Text", value: "1" }] },
		{ languageTag: "a", match: ["*", "1"], pattern: [{ type: "Text", value: "2" }] },
		{
			languageTag: "a",
			match: ["1", "*"],
			pattern: [
				{ type: "Text", value: "2" },
				{ type: "Text", value: "2" },
			],
		},
		{ languageTag: "a", match: ["1", "1"], pattern: [{ type: "Text", value: "2" }] },
		{ languageTag: "b", match: [], pattern: [{ type: "Text", value: "4" }] },
		{ languageTag: "c", match: [], pattern: [{ type: "Text", value: "5" }] },
		{ languageTag: "d", match: [], pattern: [{ type: "Text", value: "6" }] },
		{ languageTag: "e", match: [], pattern: [{ type: "Text", value: "7" }] },
		{ languageTag: "f", match: [], pattern: [{ type: "Text", value: "8" }] },
		{ languageTag: "g", match: [], pattern: [{ type: "Text", value: "9" }] },
	],
}

// stringify with no indentation
function str(obj: any) {
	return JSON.stringify(obj)
}

// stringify with 2 space indentation
function str2(obj: any) {
	return JSON.stringify(obj, undefined, 2)
}

// stringify with 4 space indentation
function str4(obj: any) {
	return JSON.stringify(obj, undefined, 4)
}

describe("normalizeMessage", () => {
	it("should return the message with sorted keys and variants", () => {
		// test cases are not the same (deep equal) before normalization
		// array order of variants is different
		expect(unsortedMessageRaw).not.toEqual(sortedMessageRaw)

		// test cases are the same after normalization
		expect(normalizeMessage(unsortedMessageRaw)).toEqual(sortedMessageRaw)

		// stringify results are not the same before normalization
		expect(str(unsortedMessageRaw)).not.toBe(str(sortedMessageRaw))

		// stringify results are the same after normalization
		expect(str(normalizeMessage(unsortedMessageRaw))).toBe(str(sortedMessageRaw))
		expect(str2(normalizeMessage(unsortedMessageRaw))).toBe(str2(sortedMessageRaw))
		expect(str4(normalizeMessage(unsortedMessageRaw))).toBe(str4(sortedMessageRaw))
	})
})

describe("stringifyMessage", () => {
	it("should normalize and JSON stringify a message with 4 space indentation", () => {
		expect(stringifyMessage(unsortedMessageRaw)).toBe(str4(sortedMessageRaw))
		expect(stringifyMessage(sortedMessageRaw)).toBe(str4(sortedMessageRaw))
	})
})

const unsortedMessageBundleRaw: AST.MessageBundle = {
	alias: {},
	inputOrder: [],
	id: "footer_categories_apps",
	messages: [
		{
			locale: "a",
			selectors: [],
			declarations: [],
			variants: [
				{ match: ["*", "1"], pattern: [{ type: "text", value: "2" }] },
				{ match: ["*", "*"], pattern: [{ type: "text", value: "1" }] },
				{
					match: ["1", "*"],
					pattern: [
						{ type: "text", value: "2" },
						{ type: "text", value: "2" },
					],
				},
				{ match: ["1", "1"], pattern: [{ type: "text", value: "2" }] },
			],
		},
		{
			locale: "b",
			selectors: [],
			declarations: [],
			variants: [
				{
					match: [],
					pattern: [{ type: "text", value: "4" }],
				},
			],
		},
		{
			locale: "c",
			selectors: [],
			declarations: [],
			variants: [
				{
					match: [],
					pattern: [{ type: "text", value: "5" }],
				},
			],
		},
		{
			locale: "d",
			selectors: [],
			declarations: [],
			variants: [
				{
					match: [],
					pattern: [{ type: "text", value: "6" }],
				},
			],
		},
		{
			locale: "e",
			selectors: [],
			declarations: [],
			variants: [
				{
					match: [],
					pattern: [{ type: "text", value: "7" }],
				},
			],
		},
		{
			locale: "f",
			selectors: [],
			declarations: [],
			variants: [
				{
					match: [],
					pattern: [{ type: "text", value: "8" }],
				},
			],
		},
		{
			locale: "g",
			selectors: [],
			declarations: [],
			variants: [
				{
					match: [],
					pattern: [{ type: "text", value: "9" }],
				},
			],
		},
	],
}

const sortedMessageBundleRaw: AST.MessageBundle = {
	alias: {},
	id: "footer_categories_apps",
	inputOrder: [],
	messages: [
		{
			declarations: [],
			locale: "a",
			selectors: [],
			variants: [
				{ match: ["*", "*"], pattern: [{ type: "text", value: "1" }] },
				{ match: ["*", "1"], pattern: [{ type: "text", value: "2" }] },
				{
					match: ["1", "*"],
					pattern: [
						{ type: "text", value: "2" },
						{ type: "text", value: "2" },
					],
				},
				{ match: ["1", "1"], pattern: [{ type: "text", value: "2" }] },
			],
		},
		{
			declarations: [],
			locale: "b",
			selectors: [],
			variants: [
				{
					match: [],
					pattern: [{ type: "text", value: "4" }],
				},
			],
		},
		{
			declarations: [],
			locale: "c",
			selectors: [],
			variants: [
				{
					match: [],
					pattern: [{ type: "text", value: "5" }],
				},
			],
		},
		{
			declarations: [],
			locale: "d",
			selectors: [],
			variants: [
				{
					match: [],
					pattern: [{ type: "text", value: "6" }],
				},
			],
		},
		{
			declarations: [],
			locale: "e",
			selectors: [],
			variants: [
				{
					match: [],
					pattern: [{ type: "text", value: "7" }],
				},
			],
		},
		{
			declarations: [],
			locale: "f",
			selectors: [],
			variants: [
				{
					match: [],
					pattern: [{ type: "text", value: "8" }],
				},
			],
		},
		{
			declarations: [],
			locale: "g",
			selectors: [],
			variants: [
				{
					match: [],
					pattern: [{ type: "text", value: "9" }],
				},
			],
		},
	],
}

describe("normalizeMessageBundle", () => {
	it("should return the message with sorted keys and variants", () => {
		// test cases are not the same (deep equal) before normalization
		// array order of variants is different
		expect(unsortedMessageBundleRaw).not.toEqual(sortedMessageBundleRaw)

		// test cases are the same after normalization
		expect(normalizeMessageBundle(unsortedMessageBundleRaw)).toEqual(sortedMessageBundleRaw)

		// stringify results are not the same before normalization
		expect(str(unsortedMessageBundleRaw)).not.toBe(str(sortedMessageBundleRaw))

		// stringify results are the same after normalization
		expect(str(normalizeMessageBundle(unsortedMessageBundleRaw))).toBe(str(sortedMessageBundleRaw))
		expect(str2(normalizeMessageBundle(unsortedMessageBundleRaw))).toBe(
			str2(sortedMessageBundleRaw)
		)
		expect(str4(normalizeMessageBundle(unsortedMessageBundleRaw))).toBe(
			str4(sortedMessageBundleRaw)
		)
	})
})

describe("stringifyMessageBundle", () => {
	it("should normalize and JSON stringify a message with 4 space indentation", () => {
		expect(stringifyMessageBundle(unsortedMessageBundleRaw)).toBe(str4(sortedMessageBundleRaw))
		expect(stringifyMessageBundle(unsortedMessageBundleRaw)).toBe(str4(sortedMessageBundleRaw))
	})
})
