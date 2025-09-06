import { test, expect } from "vitest";
import { openLix } from "../lix/open-lix.js";
import { storeDetectedChangeSchema } from "./store-detected-change-schema.js";
import type { LixPlugin } from "../plugin/lix-plugin.js";

test("storeDetectedChangeSchema stores new schema on first use", async () => {
	const lix = await openLix({});

	const testSchema = {
		"x-lix-key": "test_schema",
		"x-lix-version": "1.0",
		type: "object",
		properties: {
			value: { type: "string" },
		},
	} as const;

	// Store schema for the first time
	storeDetectedChangeSchema({
		lix,
		schema: testSchema,
	});

	// Check that schema was stored
	const storedSchema = await lix.db
		.selectFrom("stored_schema")
		.where("key", "=", "test_schema")
		.where("version", "=", "1.0")
		.selectAll()
		.execute();

	expect(storedSchema).toHaveLength(1);
	expect(storedSchema[0]?.value).toEqual(testSchema);
});

test("storeDetectedChangeSchema allows identical schema to be used again", async () => {
	const lix = await openLix({});

	const testSchema = {
		"x-lix-key": "test_schema_2",
		"x-lix-version": "1.0",
		type: "object",
		properties: {
			value: { type: "string" },
		},
	} as const;

	// Store schema first time
	storeDetectedChangeSchema({
		lix,
		schema: testSchema,
	});

	// Store same schema again - should not throw
	expect(() => {
		storeDetectedChangeSchema({
			lix,
			schema: testSchema,
		});
	}).not.toThrow();

	// Should only have one schema stored
	const storedSchemas = await lix.db
		.selectFrom("stored_schema")
		.where("key", "=", "test_schema_2")
		.selectAll()
		.execute();

	expect(storedSchemas).toHaveLength(1);
});

test("storeDetectedChangeSchema throws error when schema differs for same version", async () => {
	const lix = await openLix({});

	const originalSchema = {
		"x-lix-key": "test_schema_3",
		"x-lix-version": "1.0",
		type: "object",
		properties: {
			value: { type: "string" },
		},
	} as const;

	const differentSchema = {
		"x-lix-key": "test_schema_3",
		"x-lix-version": "1.0", // Same version
		type: "object",
		properties: {
			value: { type: "number" }, // Different property type!
		},
	} as const;

	// Store original schema
	storeDetectedChangeSchema({
		lix,
		schema: originalSchema,
	});

	// Try to store different schema with same version - should throw
	expect(() => {
		storeDetectedChangeSchema({
			lix,
			schema: differentSchema,
		});
	}).toThrow(
		"Schema differs from stored version for key 'test_schema_3' version '1.0'. Please bump the schema version (x-lix-version) to use a different schema."
	);
});

test("storeDetectedChangeSchema allows different schemas with different versions", async () => {
	const lix = await openLix({});

	const schemaV1 = {
		"x-lix-key": "test_schema_4",
		"x-lix-version": "1.0",
		type: "object",
		properties: {
			value: { type: "string" },
		},
	} as const;

	const schemaV2 = {
		"x-lix-key": "test_schema_4",
		"x-lix-version": "2.0", // Different version
		type: "object",
		properties: {
			value: { type: "number" }, // Different property type is OK with different version
		},
	} as const;

	// Store v1 schema
	storeDetectedChangeSchema({
		lix,
		schema: schemaV1,
	});

	// Store v2 schema - should not throw
	expect(() => {
		storeDetectedChangeSchema({
			lix,
			schema: schemaV2,
		});
	}).not.toThrow();

	// Should have both schemas stored
	const storedSchemas = await lix.db
		.selectFrom("stored_schema")
		.where("key", "=", "test_schema_4")
		.selectAll()
		.execute();

	expect(storedSchemas).toHaveLength(2);
	expect(storedSchemas.map((s) => s.version).sort()).toEqual(["1.0", "2.0"]);
});

test("storeDetectedChangeSchema enforces strict JSON determinism", async () => {
	const lix = await openLix({});

	const originalSchema = {
		"x-lix-key": "test_schema_5",
		"x-lix-version": "1.0",
		type: "object",
		properties: {
			a: { type: "string" },
			b: { type: "number" },
		},
	} as const;

	// Same schema but different property order
	const reorderedSchema = {
		"x-lix-key": "test_schema_5",
		"x-lix-version": "1.0",
		type: "object",
		properties: {
			b: { type: "number" }, // Reordered properties
			a: { type: "string" },
		},
	} as const;

	// Store original schema
	storeDetectedChangeSchema({
		lix,
		schema: originalSchema,
	});

	// Try to store reordered schema - should throw because JSON.stringify will be different
	expect(() => {
		storeDetectedChangeSchema({
			lix,
			schema: reorderedSchema,
		});
	}).toThrow(
		"Schema differs from stored version for key 'test_schema_5' version '1.0'. Please bump the schema version (x-lix-version) to use a different schema."
	);
});

test("integration with plugin detectChanges", async () => {
	const mockPlugin: LixPlugin = {
		key: "test-plugin",
		detectChangesGlob: "*.txt",
		detectChanges: () => [
			{
				entity_id: "entity1",
				schema: {
					"x-lix-key": "integration_test_schema",
					"x-lix-version": "1.0",
					type: "object",
					properties: {
						value: { type: "string" },
					},
				},
				snapshot_content: { value: "test" },
			},
		],
	};

	const lix = await openLix({
		providePlugins: [mockPlugin],
	});

	// Insert a file - should automatically store the schema via file handlers
	await lix.db
		.insertInto("file")
		.values({
			id: "test-file",
			data: new TextEncoder().encode("test content"),
			path: "/test.txt",
		})
		.execute();

	// Check that schema was automatically stored
	const storedSchema = await lix.db
		.selectFrom("stored_schema")
		.where("key", "=", "integration_test_schema")
		.where("version", "=", "1.0")
		.selectAll()
		.execute();

	expect(storedSchema).toHaveLength(1);
	expect(storedSchema[0]?.value).toEqual({
		"x-lix-key": "integration_test_schema",
		"x-lix-version": "1.0",
		type: "object",
		properties: {
			value: { type: "string" },
		},
	});
});
