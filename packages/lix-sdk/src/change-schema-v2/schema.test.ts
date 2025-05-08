import { test, expect } from "vitest";
import { ChangeSchemaJsonSchema, type ChangeSchema } from "./schema.js";
import { Ajv } from "ajv";

const ajv = new Ajv();

test("valid schema", () => {
	const schema = {
		type: "object",
		"x-key": "mock",
		"x-version": "1.0",
		properties: {
			name: { type: "string" },
		},
		required: ["name"],
		additionalProperties: false,
	} as const satisfies ChangeSchema;

	const valid = ajv.validate(ChangeSchemaJsonSchema, schema);

	expect(valid).toBe(true);
});

test("x-key is required", () => {
	const schema = {
		type: "object",
		// @ts-expect-error - invalid
		"x-key": undefined,
		"x-version": "1.0",
		properties: {
			name: { type: "string" },
		},
		required: ["name"],
		additionalProperties: false,
	} as const satisfies ChangeSchema;

	const valid = ajv.validate(ChangeSchemaJsonSchema, schema);

	expect(valid).toBe(false);
});

test("x-version is required", () => {
	const schema = {
		type: "object",
		// @ts-expect-error - invalid
		"x-version": undefined,
		"x-key": "mock",
		properties: {
			name: { type: "string" },
		},
		required: ["name"],
		additionalProperties: false,
	} as const satisfies ChangeSchema;

	const valid = ajv.validate(ChangeSchemaJsonSchema, schema);

	expect(valid).toBe(false);
});

