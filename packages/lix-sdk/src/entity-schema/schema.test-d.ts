/* eslint-disable @typescript-eslint/no-unused-vars */
import type { EntitySchema, FromEntitySchema } from "./schema.js";
import { test, assertType } from "vitest";

test("a json change schema should be infer the properties", () => {
	const jsonChangeSchema = {
		"x-version": "1.0",
		"x-key": "mock",
		type: "object",
		properties: {
			name: { type: "string" },
			age: { type: "number" },
			location: { type: "object" },
		},
		required: ["name", "age", "location"],
		additionalProperties: false,
	} as const satisfies EntitySchema;

	const snapshot: FromEntitySchema<typeof jsonChangeSchema> = {
		name: "John",
		age: 5,
		location: {
			city: "New York",
			country: "USA",
		},
	};

	assertType<{
		name: string;
		age: number;
		location: {
			[x: string]: unknown;
		};
	}>(snapshot);
});
