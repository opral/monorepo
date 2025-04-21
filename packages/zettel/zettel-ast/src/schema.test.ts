import { test, expect } from "vitest";
import { validate } from "./validate.js";
import type { ZettelDoc } from "./schema.js";

test("portable text example with a link passes", async () => {
	const examplePortableText = [
		{
			_type: "zettel.block",
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

test("portable text headers pass", async () => {
	const examplePortableText = [
		{
			_type: "zettel.block",
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

test("portable text bold (strong) passes", async () => {
	const examplePortableText = [
		{
			_type: "zettel.block",
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

test("portable text italic (em) passes", async () => {
	const examplePortableText = [
		{
			_type: "zettel.block",
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
					_key: "uniqueKey",
					id: "47237hh8h4h75",
				},
			],
			children: [
				{
					_type: "zettel.span",
					_key: "e60571e00344",
					text: "Hello world",
					marks: ["zettel.accountMention"],
				},
			],
		},
	];

	const result = validate(examplePortableText);
	expect(result.errors).toBeUndefined();
});
