import type { MessageNested } from "@inlang/sdk2"
import { expect, test } from "vitest"
import { parseFile } from "./parseFile.js"
import type { FileSchema } from "../fileSchema.js"

test("it parses a file with one variant", async () => {
	const mockFile = {
		some_happy_cat: "Read more about Lix",
	}

	const result = parseFile({
		locale: "en",
		content: new TextEncoder().encode(JSON.stringify(mockFile)),
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

test("it parses a file with one variant which uses variables", async () => {
	const mockFile = {
		some_happy_cat: "Used by {count} devs, {numDesigners} designers and translators",
	}

	const result = parseFile({
		locale: "en",
		content: new TextEncoder().encode(JSON.stringify(mockFile)),
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

test.todo("it parses multi variants", async () => {
	const mockFile: FileSchema = {
		some_happy_cat: {
			selectors: {
				count: "plural(count)",
			},
			match: {
				"count=one": "You have one photo.",
				"count=other": "You have {count} photos.",
			},
		},
		multi_selector: {
			"plural(photoCount)=other, plural(likeCount)=one": "You have one photo and one like.",
			"plural(photoCount)=one, plural(likeCount)=one": "You have one photo and one like.",
		},
	}

	const result = parseFile({
		locale: "en",
		content: new TextEncoder().encode(JSON.stringify(mockFile)),
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
