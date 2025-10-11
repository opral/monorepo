import { test, expect } from "vitest";
import {
	LixDeterministicModeOptionsSchema,
	type DeterministicModeOptions,
} from "./options.js";
import {
	validateLixSchema,
	validateLixSchemaDefinition,
} from "../../schema-definition/validate-lix-schema.js";

test("deterministic mode options schema is a valid LixSchemaDefinition", () => {
	expect(() =>
		validateLixSchemaDefinition(LixDeterministicModeOptionsSchema)
	).not.toThrow();
});

test("validates correct deterministic mode options", () => {
	const validOptions: DeterministicModeOptions = {
		enabled: true,
		randomLixId: false,
		timestamp: true,
		random_seed: "test-seed",
		nano_id: true,
		uuid_v7: true,
	};

	expect(() =>
		validateLixSchema(LixDeterministicModeOptionsSchema, validOptions)
	).not.toThrow();
});

test("validates minimal deterministic mode options with only required fields", () => {
	const minimalOptions: DeterministicModeOptions = {
		enabled: true,
	};

	expect(() =>
		validateLixSchema(LixDeterministicModeOptionsSchema, minimalOptions)
	).not.toThrow();
});

test("fails validation when enabled is missing", () => {
	// @ts-expect-error - Testing missing required field
	const invalidOptions: DeterministicModeOptions = {
		randomLixId: false,
		timestamp: true,
	};

	expect(() =>
		validateLixSchema(LixDeterministicModeOptionsSchema, invalidOptions)
	).toThrow(/Data validation failed/);
});

test("fails validation when enabled is not a boolean", () => {
	const invalidOptions: DeterministicModeOptions = {
		// @ts-expect-error - Testing invalid type for enabled field
		enabled: "true", // string instead of boolean
		randomLixId: false,
	};

	expect(() =>
		validateLixSchema(LixDeterministicModeOptionsSchema, invalidOptions)
	).toThrow(/Data validation failed/);
});

test("fails validation with additional properties", () => {
	const invalidOptions: DeterministicModeOptions = {
		enabled: true,
		// @ts-expect-error - Testing additional properties
		unknown_property: "value",
	};

	expect(() =>
		validateLixSchema(LixDeterministicModeOptionsSchema, invalidOptions)
	).toThrow(/Data validation failed/);
});

test("validates all boolean fields correctly", () => {
	const options: DeterministicModeOptions = {
		enabled: false,
		randomLixId: true,
		timestamp: false,
		random_seed: "custom-seed",
		nano_id: false,
		uuid_v7: true,
	};

	expect(() =>
		validateLixSchema(LixDeterministicModeOptionsSchema, options)
	).not.toThrow();
});

test("fails validation when boolean fields have wrong types", () => {
	const testCases: DeterministicModeOptions[] = [
		{
			enabled: true,
			// @ts-expect-error - Testing invalid type for randomLixId
			randomLixId: "true",
		},
		{
			enabled: true,
			// @ts-expect-error - Testing invalid type for timestamp
			timestamp: 1,
		},
		{
			enabled: true,
			// @ts-expect-error - Testing invalid type for nano_id
			nano_id: null,
		},
		{
			enabled: true,
			// @ts-expect-error - Testing invalid type for uuid_v7
			uuid_v7: {},
		},
	];

	for (const testCase of testCases) {
		expect(() =>
			validateLixSchema(LixDeterministicModeOptionsSchema, testCase)
		).toThrow(/Data validation failed/);
	}
});

test("fails validation when random_seed is not a string", () => {
	const invalidOptions: DeterministicModeOptions = {
		enabled: true,
		// @ts-expect-error - Testing invalid type for random_seed
		random_seed: 12345, // number instead of string
	};

	expect(() =>
		validateLixSchema(LixDeterministicModeOptionsSchema, invalidOptions)
	).toThrow(/Data validation failed/);
});

test("schema has correct metadata", () => {
	expect(LixDeterministicModeOptionsSchema["x-lix-key"]).toBe(
		"lix_deterministic_mode"
	);
	expect(LixDeterministicModeOptionsSchema["x-lix-version"]).toBe("1.0");
	expect(LixDeterministicModeOptionsSchema.type).toBe("object");
	expect(LixDeterministicModeOptionsSchema.required).toEqual(["enabled"]);
	expect(LixDeterministicModeOptionsSchema.additionalProperties).toBe(false);
});

test("schema has correct default values", () => {
	const properties = LixDeterministicModeOptionsSchema.properties;

	expect(properties.randomLixId["x-lix-default"]).toBe("false");
	expect(properties.timestamp["x-lix-default"]).toBe("true");
	expect(properties.random_seed["x-lix-default"]).toBe(
		"'lix-deterministic-seed'"
	);
	expect(properties.nano_id["x-lix-default"]).toBe("true");
	expect(properties.uuid_v7["x-lix-default"]).toBe("true");

	// enabled should not have a default
	expect(properties.enabled).not.toHaveProperty("x-lix-default");
});
