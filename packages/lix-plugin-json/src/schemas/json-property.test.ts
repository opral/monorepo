import { test, expect } from "vitest";
import { validateLixSchema } from "@lix-js/sdk";
import { JSONPropertySchema } from "./json-property.js";

test("JSONPropertySchema validates data with both property and value", () => {
	const validData = {
		property: "user.name",
		value: "John Doe",
	};

	expect(() => validateLixSchema(JSONPropertySchema, validData)).not.toThrow();
	expect(validateLixSchema(JSONPropertySchema, validData)).toBe(true);
});

test("JSONPropertySchema throws when property is missing", () => {
	const invalidData = {
		value: "some value",
	};

	expect(() => validateLixSchema(JSONPropertySchema, invalidData)).toThrow("Data validation failed");
});

test("JSONPropertySchema throws when value is missing", () => {
	const invalidData = {
		property: "user.email",
	};

	expect(() => validateLixSchema(JSONPropertySchema, invalidData)).toThrow("Data validation failed");
});

test("JSONPropertySchema accepts any valid JSON type as value", () => {
	const testCases = [
		// String value
		{ property: "name", value: "Alice" },
		// Number value
		{ property: "age", value: 30 },
		// Boolean value
		{ property: "active", value: true },
		// Null value
		{ property: "optional", value: null },
		// Array value
		{ property: "tags", value: ["json", "test", "plugin"] },
		// Object value
		{ property: "settings", value: { theme: "dark", notifications: true } },
		// Nested array
		{ property: "matrix", value: [[1, 2], [3, 4]] },
		// Nested object
		{ property: "user", value: { name: "Bob", address: { city: "NYC", zip: "10001" } } },
	];

	testCases.forEach((testData) => {
		expect(() => validateLixSchema(JSONPropertySchema, testData)).not.toThrow();
		expect(validateLixSchema(JSONPropertySchema, testData)).toBe(true);
	});
});

test("JSONPropertySchema throws when additionalProperties are provided", () => {
	const invalidData = {
		property: "user.id",
		value: "123",
		extraField: "should not be allowed",
	};

	expect(() => validateLixSchema(JSONPropertySchema, invalidData)).toThrow("Data validation failed");
});

test("JSONPropertySchema throws when property is not a string", () => {
	const testCases = [
		{ property: 123, value: "test" },
		{ property: true, value: "test" },
		{ property: null, value: "test" },
		{ property: { path: "user.name" }, value: "test" },
		{ property: ["user", "name"], value: "test" },
	];

	testCases.forEach((invalidData) => {
		expect(() => validateLixSchema(JSONPropertySchema, invalidData)).toThrow("Data validation failed");
	});
});

test("JSONPropertySchema accepts empty string as property", () => {
	const data = {
		property: "",
		value: "root value",
	};

	expect(() => validateLixSchema(JSONPropertySchema, data)).not.toThrow();
	expect(validateLixSchema(JSONPropertySchema, data)).toBe(true);
});

test("JSONPropertySchema accepts complex nested JSON structures", () => {
	const complexData = {
		property: "app.config",
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

	expect(() => validateLixSchema(JSONPropertySchema, complexData)).not.toThrow();
	expect(validateLixSchema(JSONPropertySchema, complexData)).toBe(true);
});