import { test, expect } from "vitest";
import { validate } from "./validate.js";
import type { ZettelDoc } from "./schema.js";

test("link passes", async () => {
	const examplePortableText = [
		{
			_type: "zettel.textBlock",
			_key: "4ee4134378b1",
			style: "normal",
			markDefs: [
				{
					_type: "zettel.link",
					_key: "6928e05a72cf",
					href: "https://example.com",
				},
			],
			children: [
				{
					_type: "zettel.span",
					_key: "e60571e00344",
					text: "Hello world, ",
					marks: [],
				},
				{
					_type: "zettel.span",
					_key: "c68e8030ad79",
					marks: ["6928e05a72cf"],
					text: "how",
				},
				{
					_type: "zettel.span",
					_key: "2d3de5b05adc",
					marks: [],
					text: " are you?",
				},
			],
		},
	];

	const result = validate(examplePortableText);
	expect(result.errors).toBeUndefined();
});

test("header h1 passes", async () => {
	const examplePortableText = [
		{
			_type: "zettel.textBlock",
			_key: "4ee4134378b1",
			style: "zettel.h1",
			markDefs: [],
			children: [
				{
					_type: "zettel.span",
					_key: "e60571e00344",
					text: "This is a header",
					marks: [],
				},
			],
		},
	];

	const result = validate(examplePortableText);
	expect(result.errors).toBeUndefined();
});

test("bold (strong) passes", async () => {
	const examplePortableText = [
		{
			_type: "zettel.textBlock",
			_key: "4ee4134378b1",
			style: "zettel.normal",
			markDefs: [],
			children: [
				{
					_type: "zettel.span",
					_key: "e60571e00344",
					text: "Hello world",
					marks: ["strong"],
				},
			],
		},
	];

	const result = validate(examplePortableText);
	expect(result.errors).toBeUndefined();
});

test("italic (em) passes", async () => {
	const examplePortableText = [
		{
			_type: "zettel.textBlock",
			_key: "4ee4134378b1",
			style: "zettel.normal",
			markDefs: [],
			children: [
				{
					_type: "zettel.span",
					_key: "e60571e00344",
					text: "Hello world",
					marks: ["em"],
				},
			],
		},
	];

	const result = validate(examplePortableText);
	expect(result.errors).toBeUndefined();
});

test("account mention passes", async () => {
	const examplePortableText: ZettelDoc = [
		{
			_type: "zettel.textBlock",
			_key: "4ee4134378b1",
			style: "zettel.normal",
			markDefs: [
				{
					_type: "zettel.accountMention",
					_key: "j93j2",
					id: "47237hh8h4h75",
				},
			],
			children: [
				{
					_type: "zettel.span",
					_key: "e60571e00344",
					text: "Hello world",
					marks: ["j93j2"],
				},
			],
		},
	];

	const result = validate(examplePortableText);
	expect(result.errors).toBeUndefined();
});

test("should reject unknown 'zettel.*' marks", () => {
	const doc: ZettelDoc = [
		{
			_type: "zettel.textBlock",
			_key: "uniqueKey",
			markDefs: [],
			style: "normal",
			children: [
				{
					_type: "zettel.span",
					_key: "spanInvalid",
					text: "Invalid mark test",
					marks: ["zettel.ananas"],
				},
			],
		},
	];

	const result = validate(doc);
	expect(result.errors).not.toBeUndefined();
});

test("allows custom blocks", () => {
	const doc: ZettelDoc = [
		{
			_type: "custom.block",
			_key: "uniqueKey",
		},
	];

	const result = validate(doc);
	expect(result.errors).toBeUndefined();
});

test("adding custom mark defs", () => {
	const doc: ZettelDoc = [
		{
			_type: "zettel.textBlock",
			_key: "uniqueKey",
			markDefs: [
				{
					_type: "custom.markDef",
					_key: "uniqueKey",
					foo: {},
				},
			],
			style: "normal",
			children: [
				{
					_type: "zettel.span",
					_key: "spanInvalid",
					text: "Invalid mark test",
					marks: ["custom.markDef"],
				},
			],
		},
	];

	const result = validate(doc);
	expect(result.errors).toBeUndefined();
});