import { test, expect } from "vitest";
import { LixSchemaJsonSchema, type LixSchema } from "./schema.js";
import { Ajv } from "ajv";

const ajv = new Ajv();

test("valid schema", () => {
	const schema = {
		type: "object",
		"x-lix-key": "mock",
		"x-lix-version": "1.0",
		properties: {
			name: { type: "string" },
		},
		required: ["name"],
		additionalProperties: false,
	} as const satisfies LixSchema;

	const valid = ajv.validate(LixSchemaJsonSchema, schema);

	expect(valid).toBe(true);
});

test("x-key is required", () => {
	const schema = {
		type: "object",
		// @ts-expect-error - invalid
		"x-lix-key": undefined,
		"x-lix-version": "1.0",
		properties: {
			name: { type: "string" },
		},
		required: ["name"],
		additionalProperties: false,
	} as const satisfies LixSchema;

	const valid = ajv.validate(LixSchemaJsonSchema, schema);

	expect(valid).toBe(false);
});

test("x-version is required", () => {
	const schema = {
		type: "object",
		// @ts-expect-error - invalid
		"x-lix-version": undefined,
		"x-lix-key": "mock",
		properties: {
			name: { type: "string" },
		},
		required: ["name"],
		additionalProperties: false,
	} as const satisfies LixSchema;

	const valid = ajv.validate(LixSchemaJsonSchema, schema);

	expect(valid).toBe(false);
});
