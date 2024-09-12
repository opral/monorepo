import type { MessageNested } from "@inlang/sdk2"
import { expect, test } from "vitest"
import { parseFile } from "./parseFile.js"

test("it parse a file with one variant", async () => {
	const mockFile = {
		some_happy_cat: "Read more about Lix",
	}

	const result = parseFile({
		locale: "en",
		fileContent: new TextEncoder().encode(JSON.stringify(mockFile)),
	})

	expect(result).toStrictEqual([
		{
			id: "some_happy_cat_en",
			bundleId: "some_happy_cat",
			locale: "en",
			selectors: [],
			declarations: [],
			variants: [
				{
					id: "some_happy_cat_en",
					match: {},
					messageId: "some_happy_cat_en",
					pattern: [{ type: "text", value: "Read more about Lix" }],
				},
			],
		},
	] satisfies MessageNested[])
})

test("it parse a file with one variant which uses variables", async () => {
	const mockFile = {
		some_happy_cat: "Used by {count} devs, {numDesigners} designers and translators",
	}

	const result = parseFile({
		locale: "en",
		fileContent: new TextEncoder().encode(JSON.stringify(mockFile)),
	})

	expect(result).toStrictEqual([
		{
			id: "some_happy_cat_en",
			bundleId: "some_happy_cat",
			locale: "en",
			selectors: [],
			declarations: [],
			variants: [
				{
					id: "some_happy_cat_en",
					match: {},
					messageId: "some_happy_cat_en",
					pattern: [
						{ type: "text", value: "Used by " },
						{
							type: "expression",
							arg: { type: "variable", name: "count" },
						},
						{
							type: "text",
							value: " devs, ",
						},
						{ type: "expression", arg: { type: "variable", name: "numDesigners" } },
						{
							type: "text",
							value: " designers and translators",
						},
					],
				},
			],
		},
	] satisfies MessageNested[])
})
