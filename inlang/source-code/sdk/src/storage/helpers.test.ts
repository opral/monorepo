import { describe, it, expect } from "vitest"
// import { parseLixUri, parseOrigin } from "./helpers.js"
import { normalizeMessage, stringifyMessage } from "./helper.js"
import type { Message } from "@inlang/message"

const unsortedMessageRaw: Message = {
	alias: {},
	inputs: [],
	id: "footer_categories_apps",
	translations: [
		{
			languageTag: "a",
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
			languageTag: "b",
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
			languageTag: "c",
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
			languageTag: "d",
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
			languageTag: "e",
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
			languageTag: "f",
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
			languageTag: "g",
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

const sortedMessageRaw: Message = {
	alias: {},
	id: "footer_categories_apps",
	inputs: [],
	translations: [
		{
			declarations: [],
			languageTag: "a",
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
			languageTag: "b",
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
			languageTag: "c",
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
			languageTag: "d",
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
			languageTag: "e",
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
			languageTag: "f",
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
			languageTag: "g",
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
