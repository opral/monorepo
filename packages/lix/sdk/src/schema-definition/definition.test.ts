import { expect, test } from "vitest";
import { LixSchemaDefinition } from "./definition.js";
import { validateLixSchemaDefinition } from "./validate-lix-schema.js";

test("valid schema", () => {
	const schema = {
		type: "object",
		"x-lix-key": "mock",
		"x-lix-version": "1.0",
		"x-lix-immutable": true,
		properties: {
			name: { type: "string" },
		},
		required: ["name"],
		additionalProperties: false,
	} as const satisfies LixSchemaDefinition;

	expect(validateLixSchemaDefinition(schema)).toBe(true);
});

test("x-lix-immutable accepts boolean values", () => {
	const schema = {
		type: "object",
		"x-lix-key": "mock",
		"x-lix-version": "1.0",
		"x-lix-immutable": false,
		properties: {
			name: { type: "string" },
		},
		required: ["name"],
		additionalProperties: false,
	} as const satisfies LixSchemaDefinition;

	expect(validateLixSchemaDefinition(schema)).toBe(true);
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

	expect(() => validateLixSchemaDefinition(schema)).toThrow();
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

	expect(validateLixSchemaDefinition(schema)).toBe(true);
});

test("x-lix-unique must be array of arrays when present", () => {
	const schema = {
		type: "object",
		"x-lix-key": "mock",
		"x-lix-version": "1.0",
		"x-lix-unique": [["/id"], ["/name", "/age"]],
		properties: {
			id: { type: "string" },
			name: { type: "string" },
			age: { type: "number" },
		},
		required: ["id", "name", "age"],
		additionalProperties: false,
	} as const satisfies LixSchemaDefinition;

	expect(validateLixSchemaDefinition(schema)).toBe(true);
});

test("x-lix-unique fails with invalid structure (not array of arrays)", () => {
	const schema = {
		type: "object",
		"x-lix-key": "mock",
		"x-lix-version": "1.0",
		"x-lix-unique": ["/id", "/name"],
		properties: {
			id: { type: "string" },
			name: { type: "string" },
		},
		required: ["id", "name"],
		additionalProperties: false,
	};

	expect(() => validateLixSchemaDefinition(schema)).toThrow();
});

test("x-lix-override-lixcols accepts cel expressions", () => {
	const schema = {
		type: "object",
		"x-lix-key": "mock",
		"x-lix-version": "1.0",
		"x-lix-override-lixcols": {
			lixcol_file_id: '"lix"',
			attempts: "3",
			enabled: "true",
			nullable: "null",
		},
		properties: {
			name: { type: "string" },
		},
		required: ["name"],
		additionalProperties: false,
	} as const satisfies LixSchemaDefinition;

	expect(validateLixSchemaDefinition(schema)).toBe(true);
});

test("x-lix-override-lixcols rejects complex values", () => {
	const schema = {
		type: "object",
		"x-lix-key": "mock",
		"x-lix-version": "1.0",
		"x-lix-override-lixcols": {
			// @ts-expect-error - objects are not allowed
			options: { nested: true },
		},
		properties: {
			name: { type: "string" },
		},
		required: ["name"],
		additionalProperties: false,
	} as const satisfies LixSchemaDefinition;

	expect(() => validateLixSchemaDefinition(schema)).toThrow();
});

test("x-lix-override-lixcols rejects invalid cel expressions", () => {
	const schema = {
		type: "object",
		"x-lix-key": "mock",
		"x-lix-version": "1.0",
		"x-lix-override-lixcols": {
			bad: "lix_uuid_v7(",
		},
		properties: {
			name: { type: "string" },
		},
		required: ["name"],
		additionalProperties: false,
	} as const satisfies LixSchemaDefinition;

	expect(() => validateLixSchemaDefinition(schema)).toThrow();
});

test("x-lix-entity-views accepts known view names", () => {
	const schema = {
		type: "object",
		"x-lix-key": "mock",
		"x-lix-version": "1.0",
		"x-lix-entity-views": ["state", "state_all"],
		properties: {
			name: { type: "string" },
		},
		required: ["name"],
		additionalProperties: false,
	} as const satisfies LixSchemaDefinition;

	expect(validateLixSchemaDefinition(schema)).toBe(true);
});

test("x-lix-entity-views rejects unknown view names", () => {
	const schema = {
		type: "object",
		"x-lix-key": "mock",
		"x-lix-version": "1.0",
		// @ts-expect-error - invalid entry should fail validation
		"x-lix-entity-views": ["state", "unknown"],
		properties: {
			name: { type: "string" },
		},
		required: ["name"],
		additionalProperties: false,
	} as const satisfies LixSchemaDefinition;

	expect(() => validateLixSchemaDefinition(schema)).toThrow();
});

test("x-lix-default accepts cel expressions", () => {
	const schema = {
		type: "object",
		"x-lix-key": "mock",
		"x-lix-version": "1.0",
		properties: {
			id: {
				type: "string",
				"x-lix-default": "lix_uuid_v7()",
			},
		},
		required: ["id"],
		additionalProperties: false,
	} as const satisfies LixSchemaDefinition;

	expect(validateLixSchemaDefinition(schema)).toBe(true);
});

test("x-lix-default rejects invalid cel expressions", () => {
	const schema = {
		type: "object",
		"x-lix-key": "mock",
		"x-lix-version": "1.0",
		properties: {
			id: {
				type: "string",
				"x-lix-default": "lix_uuid_v7(", // missing closing paren
			},
		},
		required: ["id"],
		additionalProperties: false,
	} as const satisfies LixSchemaDefinition;

	expect(() => validateLixSchemaDefinition(schema)).toThrow();
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

	expect(validateLixSchemaDefinition(schema)).toBe(true);
});

test("x-lix-primary-key must be array of strings when present", () => {
	const schema = {
		type: "object",
		"x-lix-key": "mock",
		"x-lix-version": "1.0",
		"x-lix-primary-key": ["/id", "/version"],
		properties: {
			id: { type: "string" },
			version: { type: "string" },
			name: { type: "string" },
		},
		required: ["id", "version", "name"],
		additionalProperties: false,
	} as const satisfies LixSchemaDefinition;

	expect(validateLixSchemaDefinition(schema)).toBe(true);
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

	expect(validateLixSchemaDefinition(schema)).toBe(true);
});

test("x-lix-foreign-keys with valid structure", () => {
	const schema = {
		type: "object",
		"x-lix-key": "blog_post",
		"x-lix-version": "1.0",
		"x-lix-foreign-keys": [
			{
				properties: ["/author_id"],
				references: {
					schemaKey: "user_profile",
					properties: ["/id"],
				},
			},
			{
				properties: ["/category_id"],
				references: {
					schemaKey: "post_category",
					properties: ["/id"],
				},
			},
		],
		properties: {
			id: { type: "string" },
			author_id: { type: "string" },
			category_id: { type: "string" },
		},
		required: ["id", "author_id", "category_id"],
		additionalProperties: false,
	} as const satisfies LixSchemaDefinition;

	expect(validateLixSchemaDefinition(schema)).toBe(true);
});

test("x-lix-foreign-keys with schemaVersion", () => {
	const schema = {
		type: "object",
		"x-lix-key": "comment",
		"x-lix-version": "1.0",
		"x-lix-foreign-keys": [
			{
				properties: ["/post_id"],
				references: {
					schemaKey: "blog_post",
					properties: ["/id"],
					schemaVersion: "1.0",
				},
			},
		],
		properties: {
			id: { type: "string" },
			post_id: { type: "string" },
			content: { type: "string" },
		},
		required: ["id", "post_id", "content"],
		additionalProperties: false,
	} as const satisfies LixSchemaDefinition;

	expect(validateLixSchemaDefinition(schema)).toBe(true);
});

test("x-lix-foreign-keys fails without required fields", () => {
	const schema = {
		type: "object",
		"x-lix-key": "blog_post",
		"x-lix-version": "1.0",
		"x-lix-foreign-keys": [
			{
				properties: ["/author_id"],
				// Missing required "references" field
			},
		],
		properties: {
			id: { type: "string" },
			author_id: { type: "string" },
		},
		required: ["id", "author_id"],
		additionalProperties: false,
	};

	expect(() => validateLixSchemaDefinition(schema)).toThrow();
});

test("x-lix-foreign-keys fails with invalid schemaVersion format", () => {
	const schema = {
		type: "object",
		"x-lix-key": "comment",
		"x-lix-version": "1.0",
		"x-lix-foreign-keys": [
			{
				properties: ["/post_id"],
				references: {
					schemaKey: "blog_post",
					properties: ["/id"],
					schemaVersion: "v1.0.0", // Invalid format
				},
			},
		],
		properties: {
			id: { type: "string" },
			post_id: { type: "string" },
		},
		required: ["id", "post_id"],
		additionalProperties: false,
	};

	expect(() => validateLixSchemaDefinition(schema)).toThrow();
});

test("x-lix-foreign-keys supports mode 'materialized' and 'immediate'", () => {
	const schemaMaterialized = {
		type: "object",
		"x-lix-key": "child_entity",
		"x-lix-version": "1.0",
		"x-lix-primary-key": ["/id"],
		"x-lix-foreign-keys": [
			{
				properties: ["/parent_id"],
				references: { schemaKey: "parent_entity", properties: ["/id"] },
				mode: "materialized",
			},
		],
		properties: { id: { type: "string" }, parent_id: { type: "string" } },
		required: ["id", "parent_id"],
		additionalProperties: false,
	} as const satisfies LixSchemaDefinition;

	const schemaImmediate = {
		type: "object",
		"x-lix-key": "comment",
		"x-lix-version": "1.0",
		"x-lix-primary-key": ["/id"],
		"x-lix-foreign-keys": [
			{
				properties: ["/post_id"],
				references: { schemaKey: "post", properties: ["/id"] },
				mode: "immediate",
			},
		],
		properties: { id: { type: "string" }, post_id: { type: "string" } },
		required: ["id", "post_id"],
		additionalProperties: false,
	} as const satisfies LixSchemaDefinition;

	expect(validateLixSchemaDefinition(schemaMaterialized)).toBe(true);
	expect(validateLixSchemaDefinition(schemaImmediate)).toBe(true);
});

test("x-lix-foreign-keys fails with invalid mode value", () => {
	const schema: LixSchemaDefinition = {
		type: "object",
		"x-lix-key": "child_entity",
		"x-lix-version": "1.0",
		"x-lix-primary-key": ["/id"],
		"x-lix-foreign-keys": [
			{
				properties: ["/parent_id"],
				references: { schemaKey: "parent_entity", properties: ["/id"] },
				// @ts-expect-error - invalid mode value
				mode: "deferred",
			},
		],
		properties: { id: { type: "string" }, parent_id: { type: "string" } },
		required: ["id", "parent_id"],
		additionalProperties: false,
	};

	expect(() => validateLixSchemaDefinition(schema)).toThrow();
});

test("x-lix-foreign-keys with composite key", () => {
	const schema = {
		type: "object",
		"x-lix-key": "entity_label",
		"x-lix-version": "1.0",
		"x-lix-foreign-keys": [
			{
				properties: ["/entity_id", "/schema_key", "/file_id"],
				references: {
					schemaKey: "state",
					properties: ["/entity_id", "/schema_key", "/file_id"],
				},
			},
			{
				properties: ["/label_id"],
				references: {
					schemaKey: "lix_label",
					properties: ["/id"],
				},
			},
		],
		properties: {
			entity_id: { type: "string" },
			schema_key: { type: "string" },
			file_id: { type: "string" },
			label_id: { type: "string" },
		},
		required: ["entity_id", "schema_key", "file_id", "label_id"],
		additionalProperties: false,
	} as const satisfies LixSchemaDefinition;

	expect(validateLixSchemaDefinition(schema)).toBe(true);
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

	expect(() => validateLixSchemaDefinition(schema)).toThrow();
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

	expect(validateLixSchemaDefinition(schema)).toBe(true);
});

test("x-lix-unique must be array of arrays when present", () => {
	const schema = {
		type: "object",
		"x-lix-key": "mock",
		"x-lix-version": "1.0",
		"x-lix-unique": [["/id"], ["/name", "/age"]],
		properties: {
			id: { type: "string" },
			name: { type: "string" },
			age: { type: "number" },
		},
		required: ["id", "name", "age"],
		additionalProperties: false,
	} as const satisfies LixSchemaDefinition;

	expect(validateLixSchemaDefinition(schema)).toBe(true);
});

test("x-lix-unique fails with invalid structure (not array of arrays)", () => {
	const schema = {
		type: "object",
		"x-lix-key": "mock",
		"x-lix-version": "1.0",
		"x-lix-unique": ["/id", "/name"],
		properties: {
			id: { type: "string" },
			name: { type: "string" },
		},
		required: ["id", "name"],
		additionalProperties: false,
	};

	expect(() => validateLixSchemaDefinition(schema)).toThrow();
});

test("x-lix-generated property is allowed in schema definition", () => {
	// Test that schemas with x-lix-generated compile correctly
	const TestSchemaWithGenerated = {
		"x-lix-key": "test_entity",
		"x-lix-version": "1.0",
		"x-lix-primary-key": ["/id"],
		type: "object",
		properties: {
			id: {
				type: "string",
				description: "The unique identifier",
				"x-lix-generated": true,
			},
		},
		required: ["id"],
		additionalProperties: false,
	} as const;
	TestSchemaWithGenerated satisfies LixSchemaDefinition;

	// Validate with Ajv
	expect(validateLixSchemaDefinition(TestSchemaWithGenerated)).toBe(true);

	// Test that x-lix-generated can be false
	const TestSchemaWithExplicitFalse = {
		"x-lix-key": "test_entity2",
		"x-lix-version": "1.0",
		"x-lix-primary-key": ["/id"],
		type: "object",
		properties: {
			id: {
				type: "string",
				"x-lix-generated": false,
			},
		},
		required: ["id"],
		additionalProperties: false,
	} as const;

	TestSchemaWithExplicitFalse satisfies LixSchemaDefinition;
	expect(validateLixSchemaDefinition(TestSchemaWithExplicitFalse)).toBe(true);
});
