import { test, expect } from "vitest";
import { openLix } from "../../lix/open-lix.js";
import {
	createEntityThread,
	deleteEntityThread,
} from "./create-entity-thread.js";
import { createThread } from "../../thread/create-thread.js";
import { fromPlainText } from "@opral/zettel-ast";

test("createEntityThread should create a mapping between entity and thread", async () => {
	const lix = await openLix({});

	// Create a key-value entity
	await lix.db
		.insertInto("key_value_all")
		.values({
			key: "test-config",
			value: { setting: "value1" },
			lixcol_version_id: "global",
		})
		.execute();

	const keyValue = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "test-config")
		.selectAll()
		.executeTakeFirstOrThrow();

	// Create a thread
	const thread = await createThread({
		lix,
		comments: [{ body: fromPlainText("Test comment") }],
	});

	// Create entity-thread mapping
	await createEntityThread({
		lix,
		entity: keyValue,
		thread: { id: thread.id },
	});

	// Verify mapping exists
	const mapping = await lix.db
		.selectFrom("entity_thread")
		.where("entity_id", "=", keyValue.key)
		.where("schema_key", "=", "lix_key_value")
		.where("file_id", "=", "lix")
		.where("thread_id", "=", thread.id)
		.selectAll()
		.executeTakeFirst();

	expect(mapping).toBeDefined();
	expect(mapping?.entity_id).toBe(keyValue.key);
	expect(mapping?.thread_id).toBe(thread.id);
});

test("createEntityThread should handle lixcol_ prefixed entity fields", async () => {
	const lix = await openLix({});

	// Create a key-value entity
	await lix.db
		.insertInto("key_value_all")
		.values({
			key: "test-config-2",
			value: { setting: "value2" },
			lixcol_version_id: "global",
		})
		.execute();

	const keyValue = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "test-config-2")
		.selectAll()
		.executeTakeFirstOrThrow();

	// Create a thread
	const thread = await createThread({
		lix,
		comments: [{ body: fromPlainText("Test comment 2") }],
	});

	// Create entity-thread mapping using entity object
	await createEntityThread({
		lix,
		entity: keyValue,
		thread: { id: thread.id },
	});

	// Verify mapping exists
	const mapping = await lix.db
		.selectFrom("entity_thread")
		.where("entity_id", "=", keyValue.key)
		.where("schema_key", "=", "lix_key_value")
		.where("file_id", "=", "lix")
		.where("thread_id", "=", thread.id)
		.selectAll()
		.executeTakeFirst();

	expect(mapping).toBeDefined();
	expect(mapping?.entity_id).toBe(keyValue.key);
	expect(mapping?.thread_id).toBe(thread.id);
});

test("createEntityThread should be idempotent for same entity-thread pair", async () => {
	const lix = await openLix({});

	// Create a key-value entity and thread
	await lix.db
		.insertInto("key_value_all")
		.values({
			key: "test-config-3",
			value: { setting: "value3" },
			lixcol_version_id: "global",
		})
		.execute();

	const keyValue = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "test-config-3")
		.selectAll()
		.executeTakeFirstOrThrow();

	const thread = await createThread({
		lix,
		comments: [{ body: fromPlainText("Test comment 3") }],
	});

	// Create entity-thread mapping twice
	await createEntityThread({
		lix,
		entity: keyValue,
		thread: { id: thread.id },
	});

	await createEntityThread({
		lix,
		entity: keyValue,
		thread: { id: thread.id },
	});

	// Verify only one mapping exists
	const mappings = await lix.db
		.selectFrom("entity_thread")
		.where("entity_id", "=", keyValue.key)
		.where("schema_key", "=", "lix_key_value")
		.where("file_id", "=", "lix")
		.where("thread_id", "=", thread.id)
		.selectAll()
		.execute();

	expect(mappings).toHaveLength(1);
});

test("deleteEntityThread should remove the mapping", async () => {
	const lix = await openLix({});

	// Create a key-value entity and thread
	await lix.db
		.insertInto("key_value_all")
		.values({
			key: "test-config-4",
			value: { setting: "value4" },
			lixcol_version_id: "global",
		})
		.execute();

	const keyValue = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "test-config-4")
		.selectAll()
		.executeTakeFirstOrThrow();
	const thread = await createThread({
		lix,
		comments: [{ body: fromPlainText("Test comment 4") }],
	});

	// Create entity-thread mapping
	await createEntityThread({
		lix,
		entity: keyValue,
		thread: { id: thread.id },
	});

	// Verify mapping exists
	const mappingBefore = await lix.db
		.selectFrom("entity_thread")
		.where("entity_id", "=", keyValue.key)
		.where("schema_key", "=", "lix_key_value")
		.where("file_id", "=", "lix")
		.where("thread_id", "=", thread.id)
		.selectAll()
		.executeTakeFirst();

	expect(mappingBefore).toBeDefined();

	// Delete the mapping
	await deleteEntityThread({
		lix,
		entity: keyValue,
		thread: { id: thread.id },
	});

	// Verify mapping is gone
	const mappingAfter = await lix.db
		.selectFrom("entity_thread")
		.where("entity_id", "=", keyValue.key)
		.where("schema_key", "=", "lix_key_value")
		.where("file_id", "=", "lix")
		.where("thread_id", "=", thread.id)
		.selectAll()
		.executeTakeFirst();

	expect(mappingAfter).toBeUndefined();
});

test("entity can have multiple threads", async () => {
	const lix = await openLix({});

	// Create a key-value entity
	await lix.db
		.insertInto("key_value_all")
		.values({
			key: "multi-thread-config",
			value: { setting: "multivalue" },
			lixcol_version_id: "global",
		})
		.execute();

	const keyValue = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "multi-thread-config")
		.selectAll()
		.executeTakeFirstOrThrow();

	// Create multiple threads
	const thread1 = await createThread({
		lix,
		comments: [{ body: fromPlainText("Thread 1") }],
	});
	const thread2 = await createThread({
		lix,
		comments: [{ body: fromPlainText("Thread 2") }],
	});
	const thread3 = await createThread({
		lix,
		comments: [{ body: fromPlainText("Thread 3") }],
	});

	// Create mappings
	await createEntityThread({
		lix,
		entity: keyValue,
		thread: { id: thread1.id },
	});

	await createEntityThread({
		lix,
		entity: keyValue,
		thread: { id: thread2.id },
	});

	await createEntityThread({
		lix,
		entity: keyValue,
		thread: { id: thread3.id },
	});

	// Query all threads for this entity
	const threads = await lix.db
		.selectFrom("thread")
		.innerJoin("entity_thread", "entity_thread.thread_id", "thread.id")
		.where("entity_thread.entity_id", "=", keyValue.key)
		.where("entity_thread.schema_key", "=", "lix_key_value")
		.where("entity_thread.file_id", "=", "lix")
		.select(["thread.id", "thread.metadata"])
		.execute();

	expect(threads).toHaveLength(3);
	expect(threads.map((t) => t.id)).toContain(thread1.id);
	expect(threads.map((t) => t.id)).toContain(thread2.id);
	expect(threads.map((t) => t.id)).toContain(thread3.id);
});
