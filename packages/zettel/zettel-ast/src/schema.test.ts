import { test, expect } from "vitest";
import { validate } from "./validate.js";
import type { ZettelDoc } from "./schema.js";

test("link passes", async () => {
	const examplePortableText = {
		type: "zettel_doc",
		content: [
			{
				type: "zettel_text_block",
				zettel_key: "4ee4134378b1",
				style: "zettel_normal",
				children: [
					{
						type: "zettel_span",
						zettel_key: "e60571e00344",
						text: "Hello world, ",
						marks: [],
					},
					{
						type: "zettel_span",
						zettel_key: "c68e8030ad79",
						marks: [
							{ type: "zettel_link", zettel_key: "6928e05a72cf", href: "https://example.com" },
						],
						text: "how",
					},
					{
						type: "zettel_span",
						zettel_key: "2d3de5b05adc",
						marks: [],
						text: " are you?",
					},
				],
			},
		],
	};

	const result = validate(examplePortableText);
	expect(result.errors).toBeUndefined();
});

test("header h1 passes", async () => {
	const examplePortableText = {
		type: "zettel_doc",
		content: [
			{
				type: "zettel_text_block",
				zettel_key: "4ee4134378b1",
				style: "zettel.h1",
				markDefs: [],
				children: [
					{
						type: "zettel_span",
						zettel_key: "e60571e00344",
						text: "This is a header",
						marks: [],
					},
				],
			},
		],
	};

	const result = validate(examplePortableText);
	expect(result.errors).toBeUndefined();
});

test("bold (strong) passes", async () => {
	const examplePortableText = {
		type: "zettel_doc",
		content: [
			{
				type: "zettel_text_block",
				zettel_key: "4ee4134378b1",
				style: "zettel_normal",
				markDefs: [],
				children: [
					{
						type: "zettel_span",
						zettel_key: "e60571e00344",
						text: "Hello world",
						marks: [{ type: "zettel_bold", zettel_key: "93j9jas09j2" }],
					},
				],
			},
		],
	};

	const result = validate(examplePortableText);
	expect(result.errors).toBeUndefined();
});

test("italic (em) passes", async () => {
	const examplePortableText = {
		type: "zettel_doc",
		content: [
			{
				type: "zettel_text_block",
				zettel_key: "4ee4134378b1",
				style: "zettel_normal",
				markDefs: [],
				children: [
					{
						type: "zettel_span",
						zettel_key: "e60571e00344",
						text: "Hello world",
						marks: [{ type: "zettel_italic", zettel_key: "93j9jas09j2" }],
					},
				],
			},
		],
	};

	const result = validate(examplePortableText);
	expect(result.errors).toBeUndefined();
});

test("should reject unknown 'zettel_' marks", () => {
	const doc: ZettelDoc = {
		type: "zettel_doc",
		content: [
			{
				type: "zettel_text_block",
				zettel_key: "uniqueKey",
				style: "zettel_normal",
				children: [
					{
						type: "zettel_span",
						zettel_key: "spanInvalid",
						text: "Invalid mark test",
						marks: [{ type: "zettel_ananas", zettel_key: "uniqueKey" }],
					},
				],
			},
		],
	};

	const result = validate(doc);
	expect(result.errors).not.toBeUndefined();
});

test("allows custom blocks", () => {
	const doc: ZettelDoc = {
		type: "zettel_doc",
		content: [
			{
				type: "custom_block",
				zettel_key: "uniqueKey",
			},
		],
	};

	const result = validate(doc);
	expect(result.errors).toBeUndefined();
});

test("adding custom mark defs", () => {
	const doc: ZettelDoc = {
		type: "zettel_doc",
		content: [
			{
				type: "zettel_text_block",
				zettel_key: "uniqueKey",
				style: "zettel_normal",
				children: [
					{
						type: "zettel_span",
						zettel_key: "spanInvalid",
						text: "Invalid mark test",
						marks: [{ type: "custom_mark", zettel_key: "uniqueKey", foo: {} } as any],
					},
				],
			},
		],
	};

	const result = validate(doc);
	expect(result.errors).toBeUndefined();
});

// it seems like typebox doesn't support propertyNames validation 
test.skip("custom blocks may not define keys with `zettel_` prefix to avoid conflicts", () => {
	const doc: ZettelDoc = {
		type: "zettel_doc",
		content: [
			{
				type: "custom_block",
				zettel_key: "zettel_customKey",
				zettel_custom: {},
			} as any,
		],
	};

	const result = validate(doc);
	expect(result.errors).toBeDefined();
});