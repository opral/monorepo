/* eslint-disable @typescript-eslint/no-unused-vars */
import { assertType, test } from "vitest";
import type { DetectedChange, LixPlugin } from "./lix-plugin.js";
import type {
	FromLixSchemaDefinition,
	LixSchemaDefinition,
} from "../schema-definition/definition.js";

test("json schema type of a detected change", () => {
	const MockChangeSchema = {
		"x-lix-key": "mock",
		"x-lix-version": "1.0",
		type: "object",
		properties: {
			name: { type: "string" },
			age: { type: "number" },
			location: {
				type: "object",
				properties: {
					city: { type: "string" },
					country: { type: "string" },
				},
				required: ["city", "country"],
			},
		},
		required: ["name", "age", "location"],
		additionalProperties: false,
	} as const satisfies LixSchemaDefinition;

	const change: DetectedChange<
		FromLixSchemaDefinition<typeof MockChangeSchema>
	> = {
		entity_id: "123",
		schema: MockChangeSchema,
		snapshot_content: {
			name: "John",
			age: 5,
			location: {
				city: "New York",
				country: "USA",
			},
		},
	};

	assertType(change);
});

test("file.data is potentially undefined", () => {
	const plugin: LixPlugin = {
		key: "plugin1",
		applyChanges: ({ file }) => {
			assertType<Uint8Array | undefined>(file.data);
			return { fileData: new Uint8Array() };
		},
	};
});
