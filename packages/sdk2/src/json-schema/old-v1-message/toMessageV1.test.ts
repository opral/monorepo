import { test, expect } from "vitest";
import { toMessageV1 } from "./toMessageV1.js";
import { Value } from "@sinclair/typebox/value";
import { MessageV1 } from "./schemaV1.js";
import type { BundleNested } from "../../database/schema.js";

test("toMessageV1", () => {
	const message: unknown = toMessageV1(bundle, "mock");
	expect(Value.Check(MessageV1, message)).toBe(true);

	expect(message).toStrictEqual(messageV1);
});

test("it should throw if the alias is missing", () => {
	expect(() => toMessageV1(bundle, "missing")).toThrowError(
		`Missing alias for plugin key "missing"`
	);
});

test.todo("with variable references", () => {});

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
					match: {},
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
} as BundleNested;
