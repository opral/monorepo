import { test, expect } from "vitest";
import { openLix } from "../../lix/open-lix.js";
import { LixEntityThreadSchema } from "./schema.js";
import { createEntityThread } from "./create-entity-thread.js";
import { createThread } from "../../thread/create-thread.js";
import { fromPlainText } from "@opral/zettel-ast";

test("entity_thread schema should be properly defined", () => {
	// Verify schema structure
	expect(LixEntityThreadSchema["x-lix-key"]).toBe("lix_entity_thread");
	expect(LixEntityThreadSchema["x-lix-version"]).toBe("1.0");
	expect(LixEntityThreadSchema["x-lix-primary-key"]).toEqual([
		"entity_id",
		"schema_key",
		"file_id",
		"thread_id",
	]);

	// Verify foreign keys
	expect(LixEntityThreadSchema["x-lix-foreign-keys"]).toHaveLength(2);
	expect(LixEntityThreadSchema["x-lix-foreign-keys"]![0]).toEqual({
		properties: ["entity_id", "schema_key", "file_id"],
		references: {
			schemaKey: "state",
			properties: ["entity_id", "schema_key", "file_id"],
		},
	});
	expect(LixEntityThreadSchema["x-lix-foreign-keys"]![1]).toEqual({
		properties: ["thread_id"],
		references: {
			schemaKey: "lix_thread",
			properties: ["id"],
		},
	});

	// Verify properties
	expect(LixEntityThreadSchema.properties).toEqual({
		entity_id: { type: "string" },
		schema_key: { type: "string" },
		file_id: { type: "string" },
		thread_id: { type: "string" },
	});

	// Verify required fields
	expect(LixEntityThreadSchema.required).toEqual([
		"entity_id",
		"schema_key",
		"file_id",
		"thread_id",
	]);
});

test("entity_thread foreign key to state table should be enforced", async () => {
	const lix = await openLix({});

	// Create a thread
	const thread = await createThread({
		lix,
		comments: [{ body: fromPlainText("Test") }],
	});

	// Try to create mapping with non-existent entity
	await expect(
		createEntityThread({
			lix,
			entity: {
				entity_id: "non-existent-id",
				schema_key: "lix_key_value",
				file_id: "lix",
			},
			thread: { id: thread.id },
		})
	).rejects.toThrow(/Foreign key constraint violation/);
});

test("entity_thread foreign key to thread table should be enforced", async () => {
	const lix = await openLix({});

	// Create a key-value entity
	await lix.db
		.insertInto("key_value_all")
		.values({
			key: "test-config",
			value: { setting: "testvalue" },
			lixcol_version_id: "global",
		})
		.execute();

	const keyValue = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "test-config")
		.selectAll()
		.executeTakeFirstOrThrow();

	// Try to create mapping with non-existent thread
	await expect(
		createEntityThread({
			lix,
			entity: keyValue,
			thread: { id: "non-existent-thread-id" },
		})
	).rejects.toThrow(/Foreign key constraint violation/);
});

test("entity_thread compound foreign key to state table should validate all parts", async () => {
	const lix = await openLix({});

	// Create a key-value entity and thread
	await lix.db
		.insertInto("key_value_all")
		.values({
			key: "fk-test-config",
			value: { setting: "fkvalue" },
			lixcol_version_id: "global",
		})
		.execute();

	const keyValue = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "fk-test-config")
		.selectAll()
		.executeTakeFirstOrThrow();
	const thread = await createThread({
		lix,
		comments: [{ body: fromPlainText("FK test") }],
	});

	// Create valid mapping
	await createEntityThread({
		lix,
		entity: keyValue,
		thread: { id: thread.id },
	});

	// Verify mapping exists
	const mapping = await lix.db
		.selectFrom("entity_thread")
		.where("entity_id", "=", keyValue.key)
		.where("thread_id", "=", thread.id)
		.selectAll()
		.executeTakeFirst();

	expect(mapping).toBeDefined();

	// Try to create mapping with wrong schema_key for existing entity_id
	await expect(
		createEntityThread({
			lix,
			entity: {
				entity_id: keyValue.key,
				schema_key: "wrong_schema_key", // This combination doesn't exist in state
				file_id: "lix",
			},
			thread: { id: thread.id },
		})
	).rejects.toThrow(/Foreign key constraint violation/);

	// Try to create mapping with wrong file_id for existing entity
	await expect(
		createEntityThread({
			lix,
			entity: {
				entity_id: keyValue.key,
				schema_key: "lix_key_value",
				file_id: "wrong_file.json", // This combination doesn't exist in state
			},
			thread: { id: thread.id },
		})
	).rejects.toThrow(/Foreign key constraint violation/);
});
