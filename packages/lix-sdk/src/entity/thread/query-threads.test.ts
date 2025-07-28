import { test, expect } from "vitest";
import { openLix } from "../../lix/open-lix.js";
import { createEntityThread } from "./create-entity-thread.js";
import { createThread } from "../../thread/create-thread.js";
import { ebEntity } from "../eb-entity.js";
import { fromPlainText } from "@opral/zettel-ast";

test("query all threads for a specific entity", async () => {
	const lix = await openLix({});

	// Create a label entity
	await lix.db
		.insertInto("key_value_all")
		.values({
			key: "query-test-config",
			value: { setting: "queryvalue" },
			lixcol_version_id: "global",
		})
		.execute();

	const keyValue = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "query-test-config")
		.selectAll()
		.executeTakeFirstOrThrow();

	// Create multiple threads for the entity
	const thread1 = await createThread({
		lix,
		comments: [{ body: fromPlainText("First thread") }],
	});
	const thread2 = await createThread({
		lix,
		comments: [{ body: fromPlainText("Second thread") }],
	});
	const thread3 = await createThread({
		lix,
		comments: [{ body: fromPlainText("Third thread") }],
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

	// Query threads for the entity
	const threads = await lix.db
		.selectFrom("thread")
		.innerJoin("entity_thread", "entity_thread.thread_id", "thread.id")
		.where("entity_thread.entity_id", "=", keyValue.key)
		.where("entity_thread.schema_key", "=", "lix_key_value")
		.where("entity_thread.file_id", "=", "lix")
		.select(["thread.id", "thread.metadata"])
		.execute();

	expect(threads).toHaveLength(3);
	expect(threads.map((t) => t.id).sort()).toEqual(
		[thread1.id, thread2.id, thread3.id].sort()
	);
});

test("query threads using ebEntity helper", async () => {
	const lix = await openLix({});

	// Create two different key-value entities
	await lix.db
		.insertInto("key_value_all")
		.values({
			key: "entity-config-1",
			value: { setting: "entity1" },
			lixcol_version_id: "global",
		})
		.execute();

	await lix.db
		.insertInto("key_value_all")
		.values({
			key: "entity-config-2",
			value: { setting: "entity2" },
			lixcol_version_id: "global",
		})
		.execute();

	const keyValue1 = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "entity-config-1")
		.selectAll()
		.executeTakeFirstOrThrow();

	const keyValue2 = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "entity-config-2")
		.selectAll()
		.executeTakeFirstOrThrow();

	// Create threads for each entity
	const thread1 = await createThread({
		lix,
		comments: [{ body: fromPlainText("Thread for entity 1") }],
	});
	const thread2 = await createThread({
		lix,
		comments: [{ body: fromPlainText("Another thread for entity 1") }],
	});
	const thread3 = await createThread({
		lix,
		comments: [{ body: fromPlainText("Thread for entity 2") }],
	});

	// Create mappings
	await createEntityThread({
		lix,
		entity: keyValue1,
		thread: { id: thread1.id },
	});
	await createEntityThread({
		lix,
		entity: keyValue1,
		thread: { id: thread2.id },
	});
	await createEntityThread({
		lix,
		entity: keyValue2,
		thread: { id: thread3.id },
	});

	// Query threads for entity 1 using ebEntity
	const threadsForEntity1 = await lix.db
		.selectFrom("thread_all")
		.innerJoin(
			"entity_thread_all",
			"entity_thread_all.thread_id",
			"thread_all.id"
		)
		.where("thread_all.lixcol_version_id", "=", "global")
		.where("entity_thread_all.lixcol_version_id", "=", "global")
		.where(
			ebEntity("entity_thread_all").equals({
				entity_id: keyValue1.key,
				schema_key: "lix_key_value",
				file_id: "lix",
			})
		)
		.select(["thread_all.id"])
		.execute();

	expect(threadsForEntity1).toHaveLength(2);
	expect(threadsForEntity1.map((t) => t.id).sort()).toEqual(
		[thread1.id, thread2.id].sort()
	);

	// Query threads for entity 2 using ebEntity
	const threadsForEntity2 = await lix.db
		.selectFrom("thread_all")
		.innerJoin(
			"entity_thread_all",
			"entity_thread_all.thread_id",
			"thread_all.id"
		)
		.where("thread_all.lixcol_version_id", "=", "global")
		.where("entity_thread_all.lixcol_version_id", "=", "global")
		.where(
			ebEntity("entity_thread_all").equals({
				entity_id: keyValue2.key,
				schema_key: "lix_key_value",
				file_id: "lix",
			})
		)
		.select(["thread_all.id"])
		.execute();

	expect(threadsForEntity2).toHaveLength(1);
	expect(threadsForEntity2[0]?.id).toBe(thread3.id);
});

test("query entities with threads and comment counts", async () => {
	const lix = await openLix({});

	// Create multiple key-value entities
	await lix.db
		.insertInto("key_value_all")
		.values({
			key: "with-threads",
			value: { threads: true },
			lixcol_version_id: "global",
		})
		.execute();
	await lix.db
		.insertInto("key_value_all")
		.values({
			key: "without-threads",
			value: { threads: false },
			lixcol_version_id: "global",
		})
		.execute();
	await lix.db
		.insertInto("key_value_all")
		.values({
			key: "one-thread",
			value: { threads: "one" },
			lixcol_version_id: "global",
		})
		.execute();

	const keyValue1 = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "with-threads")
		.selectAll()
		.executeTakeFirstOrThrow();
	const keyValue2 = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "without-threads")
		.selectAll()
		.executeTakeFirstOrThrow();
	const keyValue3 = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "one-thread")
		.selectAll()
		.executeTakeFirstOrThrow();

	// Create threads with different comment counts
	const thread1 = await createThread({
		lix,
		comments: [
			{ body: fromPlainText("Comment 1") },
			{ body: fromPlainText("Comment 2") },
			{ body: fromPlainText("Comment 3") },
		],
	});
	const thread2 = await createThread({
		lix,
		comments: [{ body: fromPlainText("Single comment") }],
	});
	const thread3 = await createThread({
		lix,
		comments: [
			{ body: fromPlainText("Comment A") },
			{ body: fromPlainText("Comment B") },
		],
	});

	// Create mappings
	await createEntityThread({
		lix,
		entity: keyValue1,
		thread: { id: thread1.id },
	});
	await createEntityThread({
		lix,
		entity: keyValue1,
		thread: { id: thread2.id },
	});
	await createEntityThread({
		lix,
		entity: keyValue3,
		thread: { id: thread3.id },
	});

	// Query entities with their thread and comment counts
	const entitiesWithThreads = await lix.db
		.selectFrom("entity_thread")
		.innerJoin("thread", "thread.id", "entity_thread.thread_id")
		.leftJoin("thread_comment", "thread_comment.thread_id", "thread.id")
		.where("entity_thread.file_id", "=", "lix")
		.where("entity_thread.schema_key", "=", "lix_key_value")
		.select([
			"entity_thread.entity_id",
			"entity_thread.schema_key",
			"thread.id as thread_id",
			(eb) => eb.fn.count("thread_comment.id").as("comment_count"),
		])
		.groupBy([
			"entity_thread.entity_id",
			"entity_thread.schema_key",
			"thread.id",
		])
		.execute();

	// Verify results
	const keyValue1Threads = entitiesWithThreads.filter(
		(e) => e.entity_id === keyValue1.key
	);
	expect(keyValue1Threads).toHaveLength(2);

	const thread1Result = keyValue1Threads.find(
		(t) => t.thread_id === thread1.id
	);
	expect(thread1Result?.comment_count).toBe(3);

	const thread2Result = keyValue1Threads.find(
		(t) => t.thread_id === thread2.id
	);
	expect(thread2Result?.comment_count).toBe(1);

	const keyValue3Threads = entitiesWithThreads.filter(
		(e) => e.entity_id === keyValue3.key
	);
	expect(keyValue3Threads).toHaveLength(1);
	expect(keyValue3Threads[0]?.comment_count).toBe(2);

	// Verify keyValue2 has no threads
	const keyValue2Threads = entitiesWithThreads.filter(
		(e) => e.entity_id === keyValue2.key
	);
	expect(keyValue2Threads).toHaveLength(0);
});

test("query threads across different entity types", async () => {
	const lix = await openLix({});

	// Create different types of entities
	await lix.db
		.insertInto("key_value_all")
		.values({
			key: "test-config",
			value: { test: true },
			lixcol_version_id: "global",
		})
		.execute();

	const keyValue = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "test-config")
		.selectAll()
		.executeTakeFirstOrThrow();

	// Create a change set entity (which is also stored as state)
	await lix.db
		.insertInto("change_set_all")
		.values({
			id: "test-change-set",
			lixcol_version_id: "global",
		})
		.execute();

	// Create threads
	const labelThread = await createThread({
		lix,
		comments: [{ body: fromPlainText("Thread on label") }],
	});
	const changeSetThread = await createThread({
		lix,
		comments: [{ body: fromPlainText("Thread on change set") }],
	});

	// Get the change set entity
	const changeSet = await lix.db
		.selectFrom("change_set")
		.where("id", "=", "test-change-set")
		.selectAll()
		.executeTakeFirstOrThrow();

	// Create mappings
	await createEntityThread({
		lix,
		entity: keyValue,
		thread: { id: labelThread.id },
	});
	await createEntityThread({
		lix,
		entity: changeSet,
		thread: { id: changeSetThread.id },
	});

	// Query all threads regardless of entity type
	const allThreadMappings = await lix.db
		.selectFrom("entity_thread")
		.innerJoin("thread", "thread.id", "entity_thread.thread_id")
		.select([
			"entity_thread.entity_id",
			"entity_thread.schema_key",
			"thread.id as thread_id",
		])
		.execute();

	expect(allThreadMappings).toHaveLength(2);

	// Verify we have threads on different entity types
	const schemaKeys = [...new Set(allThreadMappings.map((m) => m.schema_key))];
	expect(schemaKeys).toContain("lix_key_value");
	expect(schemaKeys).toContain("lix_change_set");
});
