import { test, expect } from "vitest";
import {
	validateLixSchema,
	validateLixSchemaDefinition,
} from "./validate-lix-schema.js";

test("validateLixSchemaDefinition passes for valid Lix schema", () => {
	const validSchema = {
		"x-lix-key": "test_entity",
		"x-lix-version": "1.0",
		type: "object",
		properties: {
			id: { type: "string" },
		},
	};

	expect(() => validateLixSchemaDefinition(validSchema)).not.toThrow();
	expect(validateLixSchemaDefinition(validSchema)).toBe(true);
});

test("validateLixSchemaDefinition throws for invalid schema", () => {
	const invalidSchema = {
		"x-lix-version": "1.0",
		type: "object",
		properties: {
			id: { type: "string" },
		},
		// Missing required x-lix-key
	};

	expect(() => validateLixSchemaDefinition(invalidSchema)).toThrow(
		"Invalid Lix schema definition"
	);
});

test("validateLixSchema validates both schema and data successfully", () => {
	const schema = {
		"x-lix-key": "user",
		"x-lix-version": "1.0",
		type: "object",
		properties: {
			id: { type: "string" },
			name: { type: "string" },
		},
		required: ["id", "name"],
	};

	const validData = {
		id: "123",
		name: "John Doe",
	};

	expect(() => validateLixSchema(schema, validData)).not.toThrow();
	expect(validateLixSchema(schema, validData)).toBe(true);
});

test("validateLixSchema throws when schema is invalid", () => {
	const invalidSchema = {
		// Missing x-lix-key
		"x-lix-version": "1.0",
		type: "object",
		properties: {
			id: { type: "string" },
		},
	};

	const data = { id: "123" };

	expect(() => validateLixSchema(invalidSchema, data)).toThrow(
		"Invalid Lix schema definition"
	);
});

test("validateLixSchema throws when data doesn't match schema", () => {
	const schema = {
		"x-lix-key": "user",
		"x-lix-version": "1.0",
		type: "object",
		properties: {
			id: { type: "string" },
			name: { type: "string" },
		},
		required: ["id", "name"],
	};

	const invalidData = {
		id: "123",
		// Missing required 'name' field
	};

	expect(() => validateLixSchema(schema, invalidData)).toThrow(
		"Data validation failed"
	);
});

test("additional properties must be false", () => {
	const schemaWithAdditionalProps = {
		"x-lix-key": "user",
		"x-lix-version": "1.0",
		type: "object",
		properties: {
			id: { type: "string" },
			name: { type: "string" },
		},
		required: ["id", "name"],
		additionalProperties: true, // This should cause validation to fail
	};

	const data = {
		id: "123",
		name: "John Doe",
		extraField: "not allowed", // Extra field not defined in schema
	};

	expect(() =>
		validateLixSchemaDefinition(schemaWithAdditionalProps)
	).toThrow();

	const validSchema = {
		"x-lix-key": "user",
		"x-lix-version": "1.0",
		type: "object",
		properties: {
			id: { type: "string" },
			name: { type: "string" },
		},
		required: ["id", "name"],
		additionalProperties: false, // Correctly set to false
	};

	expect(() => validateLixSchemaDefinition(validSchema)).not.toThrow();
	expect(validateLixSchemaDefinition(validSchema)).toBe(true);

	expect(() => validateLixSchema(validSchema, data)).toThrow(
		"Data validation failed"
	);
});