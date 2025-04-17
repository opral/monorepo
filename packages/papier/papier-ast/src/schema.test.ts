import { test, expect } from "vitest";
import { Value } from "@sinclair/typebox/value";
import { PapierAstJsonSchema } from "./schema.js";

test("portable text example with a link passes", async () => {
	const examplePortableText = [
		{
			_type: "block",
			_key: "4ee4134378b1",
			style: "normal",
			markDefs: [
				{
					_type: "link",
					_key: "6928e05a72cf",
					href: "https://example.com",
				},
			],
			children: [
				{
					_type: "span",
					_key: "e60571e00344",
					text: "Hello world, ",
					marks: [],
				},
				{
					_type: "span",
					_key: "c68e8030ad79",
					marks: ["6928e05a72cf"],
					text: "how",
				},
				{
					_type: "span",
					_key: "2d3de5b05adc",
					marks: [],
					text: " are you?",
				},
			],
		},
	];

	const result = [...Value.Errors(PapierAstJsonSchema, examplePortableText)];
	expect(result).toEqual([]);
});

test("portable text headers pass", async () => {
	const examplePortableText = [
		{
			_type: "block",
			_key: "4ee4134378b1",
			style: "h1",
			markDefs: [],
			children: [
				{
					_type: "span",
					_key: "e60571e00344",
					text: "This is a header",
					marks: [],
				},
			],
		},
	];

	const result = [...Value.Errors(PapierAstJsonSchema, examplePortableText)];
	expect(result).toEqual([]);
});

test("portable text bold (strong) passes", async () => {
	const examplePortableText = [
		{
			_type: "block",
			_key: "4ee4134378b1",
			style: "normal",
			markDefs: [],
			children: [
				{
					_type: "span",
					_key: "e60571e00344",
					text: "Hello world",
					marks: ["strong"],
				},
			],
		},
	];

	const result = [...Value.Errors(PapierAstJsonSchema, examplePortableText)];
	expect(result).toEqual([]);
});

test("portable text italic (em) passes", async () => {
	const examplePortableText = [
		{
			_type: "block",
			_key: "4ee4134378b1",
			style: "normal",
			markDefs: [],
			children: [
				{
					_type: "span",
					_key: "e60571e00344",
					text: "Hello world",
					marks: ["em"],
				},
			],
		},
	];

	const result = [...Value.Errors(PapierAstJsonSchema, examplePortableText)];
	expect(result).toEqual([]);
});

test("account mention passes", async () => {
	const examplePortableText = [
		{
			_type: "block",
			_key: "4ee4134378b1",
			style: "normal",
			markDefs: [],
			children: [
				{
					_type: "span",
					_key: "e60571e00344",
					text: "Hello world",
					marks: ["accountMention"],
				},
			],
		},
	];

	const result = [...Value.Errors(PapierAstJsonSchema, examplePortableText)];
	expect(result).toEqual([]);
});
