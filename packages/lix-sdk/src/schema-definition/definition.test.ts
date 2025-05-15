import { test, expect } from "vitest";
import { Ajv } from "ajv";
import { LixSchemaDefinition } from "./definition.js";

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
	} as const satisfies LixSchemaDefinition;

	const valid = ajv.validate(LixSchemaDefinition, schema);
	const x2 = ajv.compile(LixSchemaDefinition);

	const valid2 = x2(schema);

	expect(valid).toBe(true);
	expect(valid2).toBe(true);
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
	} as const satisfies LixSchemaDefinition;

	const valid = ajv.validate(LixSchemaDefinition, schema);

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
	} as const satisfies LixSchemaDefinition;

	const valid = ajv.validate(LixSchemaDefinition, schema);

	expect(valid).toBe(false);
});
