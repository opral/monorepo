import { test, expect } from "vitest";
import { fromMessageV1 } from "./fromMessageV1.js";
import { Value } from "@sinclair/typebox/value";
import { MessageV1 } from "../schemaV1.js";

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

const humanReadableId = "awful_lamb_mend_smooth";

const bundle = {
	alias: {
		mock: "hello_world",
	},
	id: "awful_lamb_mend_smooth",
	messages: [
		{
			bundleId: humanReadableId,
			declarations: [],
			id: humanReadableId + "_en",
			locale: "en",
			selectors: [],
			variants: [
				{
					id: humanReadableId + "_en_1",
					match: [],
					messageId: humanReadableId + "_en",
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
			bundleId: humanReadableId,
			declarations: [],
			id: humanReadableId + "_de",
			locale: "de",
			selectors: [],
			variants: [
				{
					id: humanReadableId + "_de_1",
					match: [],
					messageId: humanReadableId + "_de",
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
	const nestedBundle: unknown = fromMessageV1(messageV1, "mock");

	expect(nestedBundle).toEqual(bundle);
});

test.todo("with variable references", () => {});
