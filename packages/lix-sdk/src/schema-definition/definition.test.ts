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

test("x-lix-unique is optional", () => {
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

	expect(valid).toBe(true);
});

test("x-lix-unique must be array of arrays when present", () => {
	const schema = {
		type: "object",
		"x-lix-key": "mock",
		"x-lix-version": "1.0",
		"x-lix-unique": [["id"], ["name", "age"]],
		properties: {
			id: { type: "string" },
			name: { type: "string" },
			age: { type: "number" },
		},
		required: ["id", "name", "age"],
		additionalProperties: false,
	} as const satisfies LixSchemaDefinition;

	const valid = ajv.validate(LixSchemaDefinition, schema);

	expect(valid).toBe(true);
});

test("x-lix-unique fails with invalid structure (not array of arrays)", () => {
	const schema = {
		type: "object",
		"x-lix-key": "mock",
		"x-lix-version": "1.0",
		"x-lix-unique": ["id", "name"],
		properties: {
			id: { type: "string" },
			name: { type: "string" },
		},
		required: ["id", "name"],
		additionalProperties: false,
	};

	const valid = ajv.validate(LixSchemaDefinition, schema);

	expect(valid).toBe(false);
});

test("x-lix-primary-key is optional", () => {
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

	expect(valid).toBe(true);
});

test("x-lix-primary-key must be array of strings when present", () => {
	const schema = {
		type: "object",
		"x-lix-key": "mock",
		"x-lix-version": "1.0",
		"x-lix-primary-key": ["id", "version"],
		properties: {
			id: { type: "string" },
			version: { type: "string" },
			name: { type: "string" },
		},
		required: ["id", "version", "name"],
		additionalProperties: false,
	} as const satisfies LixSchemaDefinition;

	const valid = ajv.validate(LixSchemaDefinition, schema);

	expect(valid).toBe(true);
});

test("x-lix-foreign-keys is optional", () => {
	const schema = {
		type: "object",
		"x-lix-key": "blog_post",
		"x-lix-version": "1.0",
		properties: {
			id: { type: "string" },
			author_id: { type: "string" },
		},
		required: ["id", "author_id"],
		additionalProperties: false,
	} as const satisfies LixSchemaDefinition;

	const valid = ajv.validate(LixSchemaDefinition, schema);

	expect(valid).toBe(true);
});

test("x-lix-foreign-keys with valid structure", () => {
	const schema = {
		type: "object",
		"x-lix-key": "blog_post",
		"x-lix-version": "1.0",
		"x-lix-foreign-keys": {
			author_id: {
				schemaKey: "user_profile",
				property: "id",
			},
			category_id: {
				schemaKey: "post_category",
				property: "id",
			},
		},
		properties: {
			id: { type: "string" },
			author_id: { type: "string" },
			category_id: { type: "string" },
		},
		required: ["id", "author_id", "category_id"],
		additionalProperties: false,
	} as const satisfies LixSchemaDefinition;

	const valid = ajv.validate(LixSchemaDefinition, schema);

	expect(valid).toBe(true);
});

test("x-lix-foreign-keys with schemaVersion", () => {
	const schema = {
		type: "object",
		"x-lix-key": "comment",
		"x-lix-version": "1.0",
		"x-lix-foreign-keys": {
			post_id: {
				schemaKey: "blog_post",
				property: "id",
				schemaVersion: "1.0",
			},
		},
		properties: {
			id: { type: "string" },
			post_id: { type: "string" },
			content: { type: "string" },
		},
		required: ["id", "post_id", "content"],
		additionalProperties: false,
	} as const satisfies LixSchemaDefinition;

	const valid = ajv.validate(LixSchemaDefinition, schema);

	expect(valid).toBe(true);
});

test("x-lix-foreign-keys fails without required fields", () => {
	const schema = {
		type: "object",
		"x-lix-key": "blog_post",
		"x-lix-version": "1.0",
		"x-lix-foreign-keys": {
			author_id: {
				schemaKey: "user_profile",
				// Missing required "property" field
			},
		},
		properties: {
			id: { type: "string" },
			author_id: { type: "string" },
		},
		required: ["id", "author_id"],
		additionalProperties: false,
	};

	const valid = ajv.validate(LixSchemaDefinition, schema);

	expect(valid).toBe(false);
});

test("x-lix-foreign-keys fails with invalid schemaVersion format", () => {
	const schema = {
		type: "object",
		"x-lix-key": "comment",
		"x-lix-version": "1.0",
		"x-lix-foreign-keys": {
			post_id: {
				schemaKey: "blog_post",
				property: "id",
				schemaVersion: "v1.0.0", // Invalid format
			},
		},
		properties: {
			id: { type: "string" },
			post_id: { type: "string" },
		},
		required: ["id", "post_id"],
		additionalProperties: false,
	};

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

test("x-lix-unique is optional", () => {
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

	expect(valid).toBe(true);
});

test("x-lix-unique must be array of arrays when present", () => {
	const schema = {
		type: "object",
		"x-lix-key": "mock",
		"x-lix-version": "1.0",
		"x-lix-unique": [["id"], ["name", "age"]],
		properties: {
			id: { type: "string" },
			name: { type: "string" },
			age: { type: "number" },
		},
		required: ["id", "name", "age"],
		additionalProperties: false,
	} as const satisfies LixSchemaDefinition;

	const valid = ajv.validate(LixSchemaDefinition, schema);

	expect(valid).toBe(true);
});

test("x-lix-unique fails with invalid structure (not array of arrays)", () => {
	const schema = {
		type: "object",
		"x-lix-key": "mock",
		"x-lix-version": "1.0",
		"x-lix-unique": ["id", "name"],
		properties: {
			id: { type: "string" },
			name: { type: "string" },
		},
		required: ["id", "name"],
		additionalProperties: false,
	};

	const valid = ajv.validate(LixSchemaDefinition, schema);

	expect(valid).toBe(false);
});
