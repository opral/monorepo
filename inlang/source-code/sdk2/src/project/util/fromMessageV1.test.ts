import { test, expect } from "vitest";
import { fromMessageV1 } from "./fromMessageV1.js";
import { Value } from "@sinclair/typebox/value";
import { MessageV1 } from "../../schema/schemaV1.js";
import { BundleNested } from "../../schema/schemaV2.js";

const messageV1: MessageV1 = {
	id: "hello_world",
	alias: {},
	variants: [
		{
			languageTag: "en",
			match: [],
			pattern: [
				{
					type: "Text",
					value: "Hello World!",
				},
			],
		},
		{
			languageTag: "de",
			match: [],
			pattern: [
				{
					type: "Text",
					value: "Hallo Welt!",
				},
			],
		},
	],
	selectors: [],
};

const bundle = {
	alias: {},
	id: "hello_world",
	messages: [
		{
			bundleId: "deriveBundleIdFromMessageID",
			declarations: [],
			id: "deriveBundleIdFromMessageID_en",
			locale: "en",
			selectors: [],
			variants: [
				{
					id: "deriveBundleIdFromMessageID_en_1",
					match: [],
					messageId: "deriveBundleIdFromMessageID_en",
					pattern: [
						{
							type: "text",
							value: "Hello World!",
						},
					],
				},
			],
		},
		{
			bundleId: "deriveBundleIdFromMessageID",
			declarations: [],
			id: "deriveBundleIdFromMessageID_de",
			locale: "de",
			selectors: [],
			variants: [
				{
					id: "deriveBundleIdFromMessageID_de_1",
					match: [],
					messageId: "deriveBundleIdFromMessageID_de",
					pattern: [
						{
							type: "text",
							value: "Hallo Welt!",
						},
					],
				},
			],
		},
	],
};

test("fromMessageV1", () => {
	expect(Value.Check(MessageV1, messageV1)).toBe(true);

	const nestedBundle: unknown = fromMessageV1(messageV1);
	expect(Value.Check(BundleNested, nestedBundle)).toBe(true);

	expect(nestedBundle).toEqual(bundle);
});

test.todo("with variable references", () => {});
