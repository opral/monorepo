import { test, expect } from "vitest";
import { toMessageV1 } from "./toMessageV1.js";
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

const bundle: BundleNested = {
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

test("toMessageV1", () => {
	expect(Value.Check(BundleNested, bundle)).toBe(true);

	const message: unknown = toMessageV1(bundle);
	expect(Value.Check(MessageV1, message)).toBe(true);

	expect(message).toEqual(messageV1);
});

test.todo("with variable references", () => {});
