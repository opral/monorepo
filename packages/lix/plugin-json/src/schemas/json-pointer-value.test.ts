import { expect, test } from "vitest";
import { JSONPointerValueSchema } from "./json-pointer-value.js";
import { validateLixSchema } from "../../../sdk/dist/schema-definition/index.js";

test("JSONPointerValueSchema declares path as the primary key", () => {
	expect(JSONPointerValueSchema["x-lix-primary-key"]).toEqual(["/path"]);
});

test("JSONPointerValueSchema validates data with both path and value", () => {
	const validData = {
		path: "user.name",
		value: "John Doe",
	};

	expect(() =>
		validateLixSchema(JSONPointerValueSchema, validData),
	).not.toThrow();
	expect(validateLixSchema(JSONPointerValueSchema, validData)).toBe(true);
});

test("JSONPointerValueSchema throws when path is missing", () => {
	const invalidData = {
		value: "some value",
	};

	expect(() => validateLixSchema(JSONPointerValueSchema, invalidData)).toThrow(
		"Data validation failed",
	);
});

test("JSONPointerValueSchema throws when value is missing", () => {
	const invalidData = {
		path: "user.email",
	};

	expect(() => validateLixSchema(JSONPointerValueSchema, invalidData)).toThrow(
		"Data validation failed",
	);
});

test("JSONPointerValueSchema accepts any valid JSON type as value", () => {
	const testCases = [
		// String value
		{ path: "name", value: "Alice" },
		// Number value
		{ path: "age", value: 30 },
		// Boolean value
		{ path: "active", value: true },
		// Null value
		{ path: "optional", value: null },
		// Array value
		{ path: "tags", value: ["json", "test", "plugin"] },
		// Object value
		{ path: "settings", value: { theme: "dark", notifications: true } },
		// Nested array
		{
			path: "matrix",
			value: [
				[1, 2],
				[3, 4],
			],
		},
		// Nested object
		{
			path: "user",
			value: { name: "Bob", address: { city: "NYC", zip: "10001" } },
		},
	];

	testCases.forEach((testData) => {
		expect(() =>
			validateLixSchema(JSONPointerValueSchema, testData),
		).not.toThrow();
		expect(validateLixSchema(JSONPointerValueSchema, testData)).toBe(true);
	});
});

test("JSONPointerValueSchema throws when additionalProperties are provided", () => {
	const invalidData = {
		path: "user.id",
		value: "123",
		extraField: "should not be allowed",
	};

	expect(() => validateLixSchema(JSONPointerValueSchema, invalidData)).toThrow(
		"Data validation failed",
	);
});

test("JSONPointerValueSchema throws when path is not a string", () => {
	const testCases = [
		{ path: 123, value: "test" },
		{ path: true, value: "test" },
		{ path: null, value: "test" },
		{ path: { path: "user.name" }, value: "test" },
		{ path: ["user", "name"], value: "test" },
	];

	testCases.forEach((invalidData) => {
		expect(() =>
			validateLixSchema(JSONPointerValueSchema, invalidData),
		).toThrow("Data validation failed");
	});
});

test("JSONPointerValueSchema accepts empty string as path", () => {
	const data = {
		path: "",
		value: "root value",
	};

	expect(() => validateLixSchema(JSONPointerValueSchema, data)).not.toThrow();
	expect(validateLixSchema(JSONPointerValueSchema, data)).toBe(true);
});

test("JSONPointerValueSchema accepts complex nested JSON structures", () => {
	const complexData = {
		path: "app.config",
		value: {
			version: "1.0.0",
			features: {
				auth: {
					enabled: true,
					providers: ["oauth", "saml"],
					settings: {
						timeout: 3600,
						refreshEnabled: true,
					},
				},
				api: {
					endpoints: [
						{ path: "/users", methods: ["GET", "POST"] },
						{ path: "/products", methods: ["GET", "PUT", "DELETE"] },
					],
				},
			},
			metadata: {
				created: "2024-01-01",
				tags: ["production", "v1"],
				stats: {
					users: 1000,
					requests: 50000,
				},
			},
		},
	};

	expect(() =>
		validateLixSchema(JSONPointerValueSchema, complexData),
	).not.toThrow();
	expect(validateLixSchema(JSONPointerValueSchema, complexData)).toBe(true);
});
