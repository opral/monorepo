import { assertType, test } from "vitest";
import type { DetectedChange } from "./lix-plugin.js";
import type { ExperimentalChangeSchema } from "../change-schema/types.js";

test("json schema type of a detected change", () => {
	const MockChangeSchema = {
		key: "mock",
		type: "json",
		schema: {
			type: "object",
			properties: {
				name: { type: "string" },
				age: { type: "number" },
				location: { type: "object" },
			},
			required: ["name", "age", "location"],
		},
	} as const satisfies ExperimentalChangeSchema;

	const change: DetectedChange<typeof MockChangeSchema> = {
		entity_id: "123",
		schema: MockChangeSchema,
		snapshot: {
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
