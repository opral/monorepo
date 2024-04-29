import { describe, it, expect } from "vitest"
// import { parseLixUri, parseOrigin } from "./helpers.js"
import { normalizeMessageBundle, stringifyMessageBundle } from "./helper.js"
import { MessageBundle } from "../ast.js"

const unsortedMessageRaw: MessageBundle = {
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

const sortedMessageRaw: MessageBundle = {
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
		expect(normalizeMessageBundle(unsortedMessageRaw)).toEqual(sortedMessageRaw)

		// stringify results are not the same before normalization
		expect(str(unsortedMessageRaw)).not.toBe(str(sortedMessageRaw))

		// stringify results are the same after normalization
		expect(str(normalizeMessageBundle(unsortedMessageRaw))).toBe(str(sortedMessageRaw))
		expect(str2(normalizeMessageBundle(unsortedMessageRaw))).toBe(str2(sortedMessageRaw))
		expect(str4(normalizeMessageBundle(unsortedMessageRaw))).toBe(str4(sortedMessageRaw))
	})
})

describe("stringifyMessage", () => {
	it("should normalize and JSON stringify a message with 4 space indentation", () => {
		expect(stringifyMessageBundle(unsortedMessageRaw)).toBe(str4(sortedMessageRaw))
		expect(stringifyMessageBundle(sortedMessageRaw)).toBe(str4(sortedMessageRaw))
	})
})
